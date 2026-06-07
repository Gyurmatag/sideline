import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

export interface OutcomeState {
  label: string;
  probability: number;
}

export interface MarketState {
  question: string;
  outcomes: OutcomeState[];
  closesInSeconds?: number;
  recentTrades?: { outcome: string; shares: number; priceAfter: number }[];
}

// NOTE: keep every field required. OpenAI strict structured-output mode rejects
// optional properties (they must all appear in the schema's `required` array).
export const ForecastSchema = z.object({
  probabilities: z.array(
    z.object({
      label: z.string(),
      probability: z.number().min(0).max(1),
    }),
  ),
  reasoning: z.string().min(1).max(2000),
});

export type Forecast = z.infer<typeof ForecastSchema>;

export const FORECASTER_SYSTEM =
  "You are a transparent, well-calibrated forecaster trading PLAY MONEY on a live event prediction market. " +
  "Estimate the true probability of each outcome, give concise reasoning a spectator can follow, and avoid overconfidence. " +
  "Probabilities across outcomes should sum to 1.";

export function buildForecastPrompt(state: MarketState): string {
  const lines: string[] = [];
  lines.push(`Market question: ${state.question}`);
  lines.push("");
  lines.push("Current market-implied probabilities:");
  for (const o of state.outcomes) {
    lines.push(`- ${o.label}: ${(o.probability * 100).toFixed(1)}%`);
  }
  if (typeof state.closesInSeconds === "number") {
    const mins = Math.max(0, Math.round(state.closesInSeconds / 60));
    lines.push("");
    lines.push(`Closes in ~${mins} minute(s).`);
  }
  if (state.recentTrades && state.recentTrades.length > 0) {
    lines.push("");
    lines.push("Recent trades:");
    for (const t of state.recentTrades.slice(-5)) {
      lines.push(
        `- bought ${t.shares} of "${t.outcome}" -> ${(t.priceAfter * 100).toFixed(1)}%`,
      );
    }
  }
  lines.push("");
  lines.push(
    "Give your independent probability estimate for EACH outcome label above, plus short reasoning.",
  );
  return lines.join("\n");
}

/**
 * Defensive post-processing: ensure every market outcome has a probability,
 * clamp to [0,1], and renormalize so probabilities sum to 1. Never trade on
 * malformed model output.
 */
export function normalizeForecast(raw: Forecast, labels: string[]): Forecast {
  const byLabel = new Map(raw.probabilities.map((p) => [p.label, p.probability]));
  const clamped = labels.map((label) => {
    const v = byLabel.get(label);
    const safe = typeof v === "number" && Number.isFinite(v) ? v : 1 / labels.length;
    return { label, probability: Math.min(1, Math.max(0, safe)) };
  });
  const sum = clamped.reduce((a, c) => a + c.probability, 0);
  const probabilities =
    sum > 0
      ? clamped.map((c) => ({ ...c, probability: c.probability / sum }))
      : labels.map((label) => ({ label, probability: 1 / labels.length }));
  return {
    probabilities,
    reasoning: raw.reasoning,
  };
}

export interface ForecastResult {
  forecast: Forecast;
  usage?: { inputTokens: number; outputTokens: number };
}

/** Thin adapter over the AI SDK; logic lives in the pure functions above. */
export async function runForecast(
  model: LanguageModel,
  state: MarketState,
): Promise<ForecastResult> {
  const { object, usage } = await generateObject({
    model,
    schema: ForecastSchema,
    system: FORECASTER_SYSTEM,
    prompt: buildForecastPrompt(state),
  });
  const labels = state.outcomes.map((o) => o.label);
  return {
    forecast: normalizeForecast(object, labels),
    usage: usage
      ? {
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
        }
      : undefined,
  };
}
