import { describe, it, expect } from "vitest";
import { estimateCostUsd, pricingFor, CostBudget } from "../src/cost";

describe("estimateCostUsd", () => {
  it("computes cost from per-million pricing", () => {
    const cost = estimateCostUsd(
      { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      { inputPerMTok: 0.15, outputPerMTok: 0.6 },
    );
    expect(cost).toBeCloseTo(0.75, 10);
  });

  it("falls back to default pricing for unknown models", () => {
    expect(pricingFor("totally-unknown-model")).toEqual({
      inputPerMTok: 1,
      outputPerMTok: 5,
    });
  });

  it("knows gpt-4o-mini pricing", () => {
    expect(pricingFor("gpt-4o-mini").inputPerMTok).toBe(0.15);
  });
});

describe("CostBudget", () => {
  it("tracks spend and affordability", () => {
    const b = new CostBudget(1.0);
    expect(b.canAfford(0.4)).toBe(true);
    b.record(0.4);
    expect(b.spent).toBeCloseTo(0.4, 10);
    expect(b.remaining).toBeCloseTo(0.6, 10);
    expect(b.canAfford(0.7)).toBe(false);
    expect(b.canAfford(0.6)).toBe(true);
  });

  it("never reports negative remaining", () => {
    const b = new CostBudget(0.5);
    b.record(0.9);
    expect(b.remaining).toBe(0);
  });
});
