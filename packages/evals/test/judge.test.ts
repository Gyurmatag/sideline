import { describe, it, expect } from "vitest";
import {
  aggregateJudgeScores,
  buildJudgePrompt,
  clampScore,
} from "../src/judge";

describe("clampScore", () => {
  it("clamps into [1,5] and handles garbage", () => {
    expect(clampScore(7)).toBe(5);
    expect(clampScore(0)).toBe(1);
    expect(clampScore(3.5)).toBe(3.5);
    expect(clampScore(Number.NaN)).toBe(1);
  });
});

describe("aggregateJudgeScores", () => {
  it("reports full agreement when judges concur", () => {
    const v = aggregateJudgeScores([4, 4, 4]);
    expect(v.mean).toBe(4);
    expect(v.median).toBe(4);
    expect(v.agreement).toBe(1);
  });

  it("reports zero agreement for maximal spread", () => {
    const v = aggregateJudgeScores([1, 5]);
    expect(v.mean).toBe(3);
    expect(v.agreement).toBe(0);
  });

  it("computes partial agreement", () => {
    const v = aggregateJudgeScores([3, 4, 5]);
    expect(v.median).toBe(4);
    expect(v.agreement).toBeCloseTo(0.5, 10);
  });

  it("clamps out-of-range judge scores before aggregating", () => {
    const v = aggregateJudgeScores([6, 5]);
    expect(Math.max(...v.scores)).toBe(5);
  });
});

describe("buildJudgePrompt", () => {
  it("includes question, reasoning, and resolved outcome", () => {
    const prompt = buildJudgePrompt({
      question: "Will it rain?",
      reasoning: "Clouds are forming.",
      forecastProbability: 0.7,
      resolvedOutcome: 1,
    });
    expect(prompt).toContain("Will it rain?");
    expect(prompt).toContain("Clouds are forming.");
    expect(prompt).toContain("70.0%");
    expect(prompt).toContain("happened");
  });
});
