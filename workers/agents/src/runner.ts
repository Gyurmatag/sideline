/**
 * Forecaster agent runner (Node).
 *
 * Connects to SpacetimeDB, registers as an AI agent, then for each open market:
 *   read market state -> LLM forecast (packages/llm) -> post transparent
 *   reasoning to agent_feed -> trade toward the forecast via place_trade.
 *
 * The SpacetimeDB SDK runs in Node (Node 22 has a global WebSocket). A Cloudflare
 * Durable Object variant can reuse the same logic via the SDK's withWSFn hook.
 *
 * Run:  set -a; source .dev.vars; set +a; pnpm --filter @sideline/agents forecaster
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  CostBudget,
  estimateCostUsd,
  getLanguageModel,
  pricingFor,
  resolveModel,
  runForecast,
  selectTier,
  type Provider,
  type ProviderEnv,
} from "@sideline/llm";

import { DbConnection } from "./module_bindings";
import { decideTrade, impliedProbabilities, yesProbability } from "./strategy";

const URI = process.env.SPACETIMEDB_URI ?? "wss://maincloud.spacetimedb.com";
const DB = process.env.SPACETIMEDB_DB ?? "sideline-agentb";
const EVENT = process.env.AGENT_EVENT ?? "demo";
const PROVIDER = (process.env.AGENT_PROVIDER ?? "openai") as Provider;
const AGENT_NAME = process.env.AGENT_NAME ?? "Oracle";
const PERSONA = "a calm, calibrated quant who explains the base rate";
const TOKEN_FILE = fileURLToPath(new URL("../.agent-token", import.meta.url));

const env: ProviderEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

const budget = new CostBudget(Number(process.env.AGENT_BUDGET_USD ?? "0.50"));

function loadToken(): string | undefined {
  try {
    return existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, "utf8").trim() : undefined;
  } catch {
    return undefined;
  }
}

async function tick(conn: InstanceType<typeof DbConnection>): Promise<void> {
  const markets = Array.from(conn.db.markets.iter()).filter(
    (m) => m.eventId === EVENT && m.status === "open",
  );
  if (markets.length === 0) {
    console.log("[agent] no open markets for event", EVENT);
    return;
  }

  for (const market of markets) {
    const outcomes = Array.from(conn.db.outcomes.iter())
      .filter((o) => o.marketId === market.id)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (outcomes.length < 2) continue;

    const probs = impliedProbabilities(
      outcomes.map((o) => o.q),
      market.b,
    );
    const labeled = outcomes.map((o, i) => ({ label: o.label, probability: probs[i] }));
    const marketYes = yesProbability(labeled);

    const tier = selectTier({ priceChange: 0, secondsToClose: 99_999 });
    const spec = resolveModel(PROVIDER, tier);
    const estimate = estimateCostUsd({ inputTokens: 600, outputTokens: 250 }, pricingFor(spec.model));
    if (!budget.canAfford(estimate)) {
      console.log("[agent] budget exhausted, skipping", market.question);
      continue;
    }

    const { forecast, usage } = await runForecast(getLanguageModel(spec, env), {
      question: market.question,
      outcomes: labeled,
    });
    if (usage) budget.record(estimateCostUsd(usage, pricingFor(spec.model)));

    const forecastYes = yesProbability(forecast.probabilities);
    console.log(
      `[agent] "${market.question}" market=${(marketYes * 100).toFixed(1)}% forecast=${(forecastYes * 100).toFixed(1)}%`,
    );
    console.log(`        reasoning: ${forecast.reasoning}`);

    await conn.reducers.postAgentFeed({
      eventId: EVENT,
      marketId: market.id,
      kind: "forecast",
      reasoning: forecast.reasoning,
      probability: forecastYes,
    });

    const decision = decideTrade(marketYes, forecastYes);
    if (!decision) {
      console.log("        no edge -> hold");
      continue;
    }
    const outcome = outcomes.find((o) => o.label.toUpperCase() === decision.outcome);
    if (!outcome) continue;
    await conn.reducers.placeTrade({
      marketId: market.id,
      outcomeId: outcome.id,
      shares: decision.shares,
    });
    console.log(`        traded ${decision.shares} ${decision.outcome}`);
  }
  console.log(`[agent] spend this run: $${budget.spent.toFixed(4)}`);
}

function main(): void {
  let done = false;
  const finish = (code: number) => {
    if (done) return;
    done = true;
    process.exit(code);
  };

  DbConnection.builder()
    .withUri(URI)
    .withDatabaseName(DB)
    .withToken(loadToken())
    .onConnect((conn, identity, token) => {
      try {
        writeFileSync(TOKEN_FILE, token);
      } catch {
        /* best effort */
      }
      console.log(`[agent] connected as ${identity.toHexString().slice(0, 12)}… to ${DB}`);
      void conn.reducers
        .registerAgent({ eventId: EVENT, name: AGENT_NAME, persona: PERSONA, role: "forecaster" })
        .then(() => {
          conn
            .subscriptionBuilder()
            .onApplied(async () => {
              try {
                await tick(conn);
              } catch (err) {
                console.error("[agent] tick error:", err);
                finish(1);
                return;
              }
              conn.disconnect();
              finish(0);
            })
            .subscribe([
              "SELECT * FROM markets",
              "SELECT * FROM outcomes",
              "SELECT * FROM agents",
            ]);
        })
        .catch((err) => {
          console.error("[agent] registerAgent failed:", err);
          finish(1);
        });
    })
    .onConnectError((_ctx, error) => {
      console.error("[agent] connection error:", error);
      finish(1);
    })
    .build();

  // Safety timeout so a stuck run never hangs forever.
  setTimeout(() => {
    console.error("[agent] timeout");
    finish(1);
  }, 60_000);
}

main();
