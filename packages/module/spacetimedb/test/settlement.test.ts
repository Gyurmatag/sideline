import { describe, it, expect } from "vitest";
import { settleCredits, resolvedPrices } from "../src/settlement";

describe("settleCredits", () => {
  it("pays 1 per winning share and 0 to losers", () => {
    const credits = settleCredits(
      [
        { owner: "alice", outcomeId: 1n, shares: 10 },
        { owner: "bob", outcomeId: 2n, shares: 25 },
        { owner: "alice", outcomeId: 2n, shares: 5 },
      ],
      1n,
    );
    expect(credits.get("alice")).toBe(10);
    expect(credits.has("bob")).toBe(false);
  });

  it("aggregates multiple winning positions per owner", () => {
    const credits = settleCredits(
      [
        { owner: "alice", outcomeId: 1n, shares: 10 },
        { owner: "alice", outcomeId: 1n, shares: 7 },
      ],
      1n,
    );
    expect(credits.get("alice")).toBe(17);
  });

  it("ignores zero/negative shares", () => {
    const credits = settleCredits([{ owner: "x", outcomeId: 1n, shares: 0 }], 1n);
    expect(credits.size).toBe(0);
  });
});

describe("resolvedPrices", () => {
  it("sets the winner to 1 and others to 0", () => {
    expect(resolvedPrices([1n, 2n, 3n], 2n)).toEqual([
      { outcomeId: 1n, prob: 0 },
      { outcomeId: 2n, prob: 1 },
      { outcomeId: 3n, prob: 0 },
    ]);
  });
});
