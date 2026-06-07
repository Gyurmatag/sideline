import { generateObject } from "ai";
import {
  getLanguageModel,
  type ModelSpec,
  type ProviderEnv,
} from "@sideline/llm";
import { z } from "zod";

import { mean, median } from "./consensus";

/**
 * Tier 2 of the eval system: LLM-as-judge. We ask multiple models (across
 * providers) to score a forecaster's reasoning, then aggregate. Using an
 * ensemble across providers reduces single-model bias.
 */

export interface JudgeItem {
  question: string;
  reasoning: string;
  forecastProbability: number;
  /** Realized outcome if known (1/0), for post-hoc grading. */
  resolvedOutcome?: 0 | 1;
}

export const JudgeSchema = z.object({
  score: z.number().min(1).max(5),
  rationale: z.string().min(1).max(800),
});
export type JudgeVerdict = z.infer<typeof JudgeSchema>;

export const JUDGE_SYSTEM =
  "You are evaluating the quality of a play-money market forecaster's reasoning. " +
  "Score 1-5 on logical soundness, use of evidence, and calibration (does the confidence match the argument?). " +
  "5 = excellent, 1 = poor. Be a strict, consistent grader.";

export function buildJudgePrompt(item: JudgeItem): string {
  const lines = [
    `Market question: ${item.question}`,
    `Forecaster probability: ${(item.forecastProbability * 100).toFixed(1)}%`,
    `Forecaster reasoning: ${item.reasoning}`,
  ];
  if (item.resolvedOutcome !== undefined) {
    lines.push(
      `Actual outcome: ${item.resolvedOutcome === 1 ? "happened" : "did not happen"}`,
    );
  }
  lines.push("");
  lines.push("Score the reasoning quality from 1 to 5 with a brief rationale.");
  return lines.join("\n");
}

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 1;
  return Math.min(5, Math.max(1, score));
}

export interface EnsembleVerdict {
  scores: number[];
  mean: number;
  median: number;
  /** 1 = perfect agreement, 0 = maximal disagreement on the 1-5 scale. */
  agreement: number;
}

/** Aggregate judge scores into an ensemble verdict (pure). */
export function aggregateJudgeScores(scores: number[]): EnsembleVerdict {
  if (scores.length === 0) throw new Error("evals: no judge scores");
  const clamped = scores.map(clampScore);
  const range = Math.max(...clamped) - Math.min(...clamped);
  return {
    scores: clamped,
    mean: mean(clamped),
    median: median(clamped),
    agreement: 1 - range / 4, // 1-5 scale => max range 4
  };
}

/** Thin adapter: one judge model scores one item. Logic is in the pure helpers. */
export async function runJudge(
  spec: ModelSpec,
  env: ProviderEnv,
  item: JudgeItem,
): Promise<JudgeVerdict> {
  const { object } = await generateObject({
    model: getLanguageModel(spec, env),
    schema: JudgeSchema,
    system: JUDGE_SYSTEM,
    prompt: buildJudgePrompt(item),
  });
  return { score: clampScore(object.score), rationale: object.rationale };
}

/** Run an ensemble of judges (across providers) and aggregate their scores. */
export async function runEnsembleJudge(
  specs: ModelSpec[],
  env: ProviderEnv,
  item: JudgeItem,
): Promise<EnsembleVerdict & { rationales: string[] }> {
  const verdicts = await Promise.all(specs.map((s) => runJudge(s, env, item)));
  const agg = aggregateJudgeScores(verdicts.map((v) => v.score));
  return { ...agg, rationales: verdicts.map((v) => v.rationale) };
}
