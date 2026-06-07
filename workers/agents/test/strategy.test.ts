import { describe, it, expect } from "vitest";
import { decideTrade, yesProbability } from "../src/strategy";

describe("decideTrade", () => {
  it("does nothing when the edge is below the threshold", () => {
    expect(decideTrade(0.5, 0.52)).toBeNull();
  });

  it("buys YES when it thinks YES is underpriced", () => {
    const d = decideTrade(0.4, 0.6);
    expect(d).not.toBeNull();
    expect(d!.outcome).toBe("YES");
    expect(d!.shares).toBeGreaterThan(0);
  });

  it("buys NO when it thinks YES is overpriced", () => {
    const d = decideTrade(0.8, 0.5);
    expect(d!.outcome).toBe("NO");
  });

  it("caps shares at maxShares", () => {
    const d = decideTrade(0.05, 0.95, { maxShares: 25 });
    expect(d!.shares).toBe(25);
  });

  it("scales shares with the edge", () => {
    const small = decideTrade(0.5, 0.6, { maxShares: 100 })!;
    const big = decideTrade(0.5, 0.8, { maxShares: 100 })!;
    expect(big.shares).toBeGreaterThan(small.shares);
  });

  it("ignores non-finite input", () => {
    expect(decideTrade(0.5, Number.NaN)).toBeNull();
  });
});

describe("yesProbability", () => {
  it("finds the YES outcome", () => {
    expect(
      yesProbability([
        { label: "YES", probability: 0.62 },
        { label: "NO", probability: 0.38 },
      ]),
    ).toBe(0.62);
  });

  it("defaults to 0.5 when YES is missing", () => {
    expect(yesProbability([{ label: "MAYBE", probability: 0.3 }])).toBe(0.5);
  });
});
