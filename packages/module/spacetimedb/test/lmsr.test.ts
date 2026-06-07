import { describe, it, expect } from "vitest";
import { lmsrCost, lmsrPrices, priceOf, costToBuy } from "../src/lmsr";

describe("lmsrPrices", () => {
  it("is uniform at the start of a binary market", () => {
    const p = lmsrPrices([0, 0], 50);
    expect(p[0]).toBeCloseTo(0.5, 10);
    expect(p[1]).toBeCloseTo(0.5, 10);
  });

  it("always sums to 1", () => {
    for (const q of [
      [0, 0],
      [10, 3],
      [100, 5, 42],
      [-20, 60, 7, 1],
    ]) {
      const sum = lmsrPrices(q, 37).reduce((a, c) => a + c, 0);
      expect(sum).toBeCloseTo(1, 10);
    }
  });

  it("is monotonic: buying an outcome raises its price", () => {
    const before = priceOf([0, 0], 0, 50);
    const after = priceOf([50, 0], 0, 50);
    expect(after).toBeGreaterThan(before);
    expect(after).toBeCloseTo(0.7310585786, 8);
  });

  it("stays numerically stable for huge share counts", () => {
    const p = lmsrPrices([100_000, 0], 50);
    expect(Number.isFinite(p[0])).toBe(true);
    expect(p[0]).toBeCloseTo(1, 10);
    expect(p[1]).toBeCloseTo(0, 10);
  });
});

describe("lmsrCost", () => {
  it("matches the closed form at the origin", () => {
    // C([0,0], b) = b * ln(2)
    expect(lmsrCost([0, 0], 50)).toBeCloseTo(50 * Math.log(2), 8);
  });

  it("is increasing in shares", () => {
    const c0 = lmsrCost([0, 0], 50);
    const c1 = lmsrCost([10, 0], 50);
    const c2 = lmsrCost([20, 0], 50);
    expect(c1).toBeGreaterThan(c0);
    expect(c2).toBeGreaterThan(c1);
  });
});

describe("costToBuy", () => {
  it("matches a hand-computed value", () => {
    // C([50,0],50) - C([0,0],50) = 65.663247 - 34.657359 = 31.0057253
    expect(costToBuy([0, 0], 0, 50, 50)).toBeCloseTo(31.0057253, 6);
  });

  it("is positive and below the share count (each share costs < 1)", () => {
    const cost = costToBuy([0, 0], 0, 10, 50);
    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(10);
  });

  it("costs more as the outcome gets more likely (convexity)", () => {
    const first10 = costToBuy([0, 0], 0, 10, 50);
    const next10 = costToBuy([10, 0], 0, 10, 50);
    expect(next10).toBeGreaterThan(first10);
  });

  it("throws on an out-of-range outcome index", () => {
    expect(() => costToBuy([0, 0], 5, 10, 50)).toThrow();
  });
});
