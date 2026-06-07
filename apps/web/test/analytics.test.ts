import { describe, it, expect } from "vitest";
import {
  computeEventStats,
  tradesByOutcome,
  cumulativeVolume,
  type AnalyticsTrade,
} from "../lib/analytics";

const trades: AnalyticsTrade[] = [
  { cost: 10, traderHex: "a", outcomeId: "1", isAgent: false },
  { cost: 5, traderHex: "b", outcomeId: "2", isAgent: true },
  { cost: 7, traderHex: "a", outcomeId: "1", isAgent: false },
];

describe("computeEventStats", () => {
  it("aggregates volume, unique traders, and human/agent split", () => {
    const s = computeEventStats(trades);
    expect(s.totalTrades).toBe(3);
    expect(s.volume).toBeCloseTo(22, 10);
    expect(s.uniqueTraders).toBe(2);
    expect(s.agentTrades).toBe(1);
    expect(s.humanTrades).toBe(2);
  });

  it("handles no trades", () => {
    expect(computeEventStats([])).toEqual({
      totalTrades: 0,
      volume: 0,
      uniqueTraders: 0,
      humanTrades: 0,
      agentTrades: 0,
    });
  });
});

describe("tradesByOutcome", () => {
  it("groups counts and volume by outcome label", () => {
    const rows = tradesByOutcome(trades, (id) => (id === "1" ? "YES" : "NO"));
    const yes = rows.find((r) => r.label === "YES")!;
    expect(yes.count).toBe(2);
    expect(yes.volume).toBeCloseTo(17, 10);
  });
});

describe("cumulativeVolume", () => {
  it("accumulates absolute cost over the sequence", () => {
    expect(cumulativeVolume(trades).map((p) => p.volume)).toEqual([10, 15, 22]);
  });
});
