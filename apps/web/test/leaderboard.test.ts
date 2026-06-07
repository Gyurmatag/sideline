import { describe, it, expect } from "vitest";
import { netWorths } from "../lib/leaderboard";

describe("netWorths", () => {
  const prices = new Map<string, number>([
    ["1", 0.7], // YES
    ["2", 0.3], // NO
  ]);

  it("adds mark-to-market position value to balance", () => {
    const rows = netWorths(
      [{ hex: "a", balance: 900, name: "A", isAgent: false }],
      [{ ownerHex: "a", outcomeId: "1", shares: 100 }],
      prices,
    );
    // 900 + 100 * 0.7
    expect(rows[0].net).toBeCloseTo(970, 10);
  });

  it("ranks traders by net worth descending", () => {
    const rows = netWorths(
      [
        { hex: "a", balance: 1000, name: "A", isAgent: false },
        { hex: "b", balance: 800, name: "B", isAgent: true },
      ],
      [{ ownerHex: "b", outcomeId: "1", shares: 500 }], // 800 + 350 = 1150
      prices,
    );
    expect(rows.map((r) => r.hex)).toEqual(["b", "a"]);
  });

  it("treats unknown outcomes as zero value", () => {
    const rows = netWorths(
      [{ hex: "a", balance: 500, name: "A", isAgent: false }],
      [{ ownerHex: "a", outcomeId: "999", shares: 10 }],
      prices,
    );
    expect(rows[0].net).toBe(500);
  });
});
