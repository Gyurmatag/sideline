import { describe, it, expect } from "vitest";
import { selectTier, DEFAULT_MATERIALITY } from "../src/materiality";

describe("selectTier", () => {
  it("uses cheap tier for small moves far from close", () => {
    expect(selectTier({ priceChange: 0.02, secondsToClose: 3600 })).toBe("cheap");
  });

  it("escalates to frontier on a material price move", () => {
    expect(selectTier({ priceChange: 0.2, secondsToClose: 3600 })).toBe("frontier");
  });

  it("escalates to frontier near close", () => {
    expect(selectTier({ priceChange: 0, secondsToClose: 120 })).toBe("frontier");
  });

  it("respects the forced flag", () => {
    expect(selectTier({ priceChange: 0, secondsToClose: 99999, forced: true })).toBe(
      "frontier",
    );
  });

  it("treats the threshold as inclusive", () => {
    expect(
      selectTier(
        { priceChange: DEFAULT_MATERIALITY.priceChangeThreshold, secondsToClose: 9999 },
        DEFAULT_MATERIALITY,
      ),
    ).toBe("frontier");
  });
});
