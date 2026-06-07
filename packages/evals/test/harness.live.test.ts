import { describe, it, expect } from "vitest";
import {
  runForecast,
  getLanguageModel,
  resolveModel,
  availableProviders,
  type ProviderEnv,
  type Provider,
} from "@sideline/llm";

import { brierScore, logLoss, calibrationError } from "../src/brier";
import { consensusProbability } from "../src/consensus";
import { runEnsembleJudge } from "../src/judge";

/**
 * End-to-end multi-tier eval harness. OFF by default (network + tokens).
 * Run:  RUN_EVAL_HARNESS=1 (with keys in env) pnpm --filter @sideline/evals test
 *
 * Demonstrates: multi-provider forecasts -> consensus -> cross-model judge
 * ensemble -> quantitative scoring (Brier / log-loss / calibration).
 */
const RUN = !!process.env.RUN_EVAL_HARNESS;

const env: ProviderEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

interface EvalMarket {
  question: string;
  /** Ground-truth outcome for scoring (1 = YES happened). */
  outcome: 0 | 1;
}

const MARKETS: EvalMarket[] = [
  { question: "Will the sun rise tomorrow?", outcome: 1 },
  { question: "Is the Eiffel Tower located in Paris, France?", outcome: 1 },
  { question: "Will a single roll of a fair six-sided die land on a 6?", outcome: 0 },
];

function yesProbability(probabilities: { label: string; probability: number }[]): number {
  const yes = probabilities.find((p) => p.label.toUpperCase() === "YES");
  return yes ? yes.probability : 0.5;
}

describe("multi-tier eval harness", () => {
  it.skipIf(!RUN)(
    "runs forecasts, consensus, judge ensemble, and scoring",
    async () => {
      const providers: Provider[] = availableProviders(env).filter(
        (p) => p !== "anthropic", // include once the Anthropic key arrives
      );
      expect(providers.length).toBeGreaterThan(0);

      const consensusPredictions: { probability: number; outcome: 0 | 1 }[] = [];
      const report: string[] = ["", "=== Sideline eval harness ==="];

      for (const market of MARKETS) {
        const perProvider: { provider: Provider; yes: number; reasoning: string }[] = [];
        for (const provider of providers) {
          const model = getLanguageModel(resolveModel(provider, "cheap"), env);
          const { forecast } = await runForecast(model, {
            question: market.question,
            outcomes: [
              { label: "YES", probability: 0.5 },
              { label: "NO", probability: 0.5 },
            ],
          });
          perProvider.push({
            provider,
            yes: yesProbability(forecast.probabilities),
            reasoning: forecast.reasoning,
          });
        }

        const consensus = consensusProbability(perProvider.map((p) => p.yes));
        consensusPredictions.push({ probability: consensus, outcome: market.outcome });

        // Cross-model judge ensemble on the first provider's reasoning.
        const judge = await runEnsembleJudge(
          providers.map((p) => resolveModel(p, "cheap")),
          env,
          {
            question: market.question,
            reasoning: perProvider[0].reasoning,
            forecastProbability: perProvider[0].yes,
            resolvedOutcome: market.outcome,
          },
        );

        report.push(
          `\nQ: ${market.question}  (actual: ${market.outcome ? "YES" : "NO"})`,
        );
        for (const p of perProvider) {
          report.push(`   ${p.provider.padEnd(8)} YES=${(p.yes * 100).toFixed(1)}%`);
        }
        report.push(`   consensus YES=${(consensus * 100).toFixed(1)}%`);
        report.push(
          `   judge ensemble: mean=${judge.mean.toFixed(2)}/5 agreement=${judge.agreement.toFixed(2)}`,
        );

        expect(judge.mean).toBeGreaterThanOrEqual(1);
        expect(judge.mean).toBeLessThanOrEqual(5);
      }

      const brier = brierScore(consensusPredictions);
      const ll = logLoss(consensusPredictions);
      const ece = calibrationError(consensusPredictions, 5);

      report.push("\n--- scoring (consensus forecasts) ---");
      report.push(`Brier: ${brier.toFixed(4)}  (lower better)`);
      report.push(`LogLoss: ${ll.toFixed(4)}`);
      report.push(`Calibration error: ${ece.toFixed(4)}`);
      report.push("");
      console.log(report.join("\n"));

      expect(brier).toBeGreaterThanOrEqual(0);
      expect(brier).toBeLessThanOrEqual(1);
      // A competent ensemble should beat the always-0.5 baseline (Brier 0.25).
      expect(brier).toBeLessThan(0.25);
    },
    120_000,
  );
});
