/**
 * Cloudflare cron Worker: a continuously-deployed forecaster agent. On each
 * scheduled tick it reads market state over the SpacetimeDB HTTP API, produces
 * an LLM forecast (Vercel AI SDK), and writes a transparent reasoning entry +
 * a trade back over HTTP. No WebSocket needed, so it runs reliably in workerd.
 */
import {
  getLanguageModel,
  resolveModel,
  runForecast,
  type Provider,
  type ProviderEnv,
} from "@sideline/llm";

import { decideTrade, impliedProbabilities, yesProbability } from "./strategy";
import { rowsToObjects, stdbCall, stdbSql, type StdbConfig } from "./stdb-http";

interface Env {
  SPACETIMEDB_HOST: string;
  SPACETIMEDB_DB: string;
  AGENT_TOKEN: string;
  AGENT_EVENT?: string;
  AGENT_NAME?: string;
  AGENT_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

async function runForecastTick(env: Env): Promise<string> {
  const cfg: StdbConfig = {
    host: env.SPACETIMEDB_HOST,
    db: env.SPACETIMEDB_DB,
    token: env.AGENT_TOKEN,
  };
  const event = env.AGENT_EVENT ?? "demo";
  const name = env.AGENT_NAME ?? "Oracle";
  const provider = (env.AGENT_PROVIDER ?? "openai") as Provider;
  const providerEnv: ProviderEnv = {
    OPENAI_API_KEY: env.OPENAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
    ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
  };

  // Make sure this token is registered as an agent (idempotent).
  await stdbCall(cfg, "register_agent", [
    event,
    name,
    "a calm, calibrated quant who explains the base rate",
    "forecaster",
  ]);

  const marketsRes = await stdbSql(
    cfg,
    "SELECT id, event_id, question, status, b FROM markets",
  );
  const markets = rowsToObjects(marketsRes[0]);
  const open = markets
    .filter((m) => m.event_id === event && m.status === "open")
    .sort((a, b) => Number(b.id) - Number(a.id));
  if (open.length === 0) return "no open market";
  const market = open[0];

  const outsRes = await stdbSql(cfg, "SELECT id, market_id, label, q FROM outcomes");
  const outs = rowsToObjects(outsRes[0])
    .filter((o) => Number(o.market_id) === Number(market.id))
    .sort((a, b) => Number(a.id) - Number(b.id));
  if (outs.length < 2) return "not enough outcomes";

  const probs = impliedProbabilities(
    outs.map((o) => Number(o.q)),
    Number(market.b),
  );
  const labeled = outs.map((o, i) => ({
    label: String(o.label),
    probability: probs[i],
  }));
  const marketYes = yesProbability(labeled);

  const model = getLanguageModel(resolveModel(provider, "cheap"), providerEnv);
  const { forecast } = await runForecast(model, {
    question: String(market.question),
    outcomes: labeled,
  });
  const forecastYes = yesProbability(forecast.probabilities);

  await stdbCall(cfg, "post_agent_feed", [
    event,
    Number(market.id),
    "forecast",
    forecast.reasoning,
    forecastYes,
  ]);

  const decision = decideTrade(marketYes, forecastYes);
  let traded = "";
  if (decision) {
    const outcome = outs.find(
      (o) => String(o.label).toUpperCase() === decision.outcome,
    );
    if (outcome) {
      await stdbCall(cfg, "place_trade", [
        Number(market.id),
        Number(outcome.id),
        decision.shares,
      ]);
      traded = ` traded ${decision.shares} ${decision.outcome}`;
    }
  }
  return `${name}: market ${(marketYes * 100).toFixed(1)}% forecast ${(forecastYes * 100).toFixed(1)}%${traded}`;
}

export default {
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runForecastTick(env)
        .then((r) => console.log("[cron]", r))
        .catch((e) => console.error("[cron error]", e)),
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/run") {
      try {
        return new Response(await runForecastTick(env));
      } catch (e) {
        return new Response(String(e), { status: 500 });
      }
    }
    return new Response(
      "Sideline forecaster worker — runs on a cron; POST/GET /run to trigger a tick.",
    );
  },
};
