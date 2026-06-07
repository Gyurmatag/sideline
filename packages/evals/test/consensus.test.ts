import { describe, it, expect } from "vitest";
import { median, mean, consensusProbability } from "../src/consensus";

describe("median", () => {
  it("handles odd-length lists", () => {
    expect(median([0.2, 0.5, 0.9])).toBe(0.5);
  });

  it("averages the middle two for even-length lists", () => {
    expect(median([0.2, 0.8])).toBeCloseTo(0.5, 10);
  });
});

describe("mean", () => {
  it("averages", () => {
    expect(mean([1, 2, 3])).toBe(2);
  });
});

describe("consensusProbability", () => {
  it("is robust to a single outlier model", () => {
    // Two models near 0.5, one wild outlier at 0.99 -> median stays sensible.
    expect(consensusProbability([0.5, 0.52, 0.99])).toBeCloseTo(0.52, 10);
  });
});
