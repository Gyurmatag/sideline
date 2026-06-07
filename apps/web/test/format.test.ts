import { describe, it, expect } from "vitest";
import { slugify, formatPlayMoney, formatProbability, formatPercent1 } from "../lib/format";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("FOMO Hackathon 2026")).toBe("fomo-hackathon-2026");
  });

  it("strips leading/trailing separators and collapses runs", () => {
    expect(slugify("  Best   Game!! ")).toBe("best-game");
  });

  it("strips accents", () => {
    expect(slugify("Café Démo")).toBe("cafe-demo");
  });
});

describe("formatPlayMoney", () => {
  it("formats with thousands separators and a default currency", () => {
    expect(formatPlayMoney(1000)).toBe("1,000 Sideline Bucks");
  });

  it("uses a custom currency name", () => {
    expect(formatPlayMoney(2500, "FomoCoins")).toBe("2,500 FomoCoins");
  });
});

describe("probability formatting", () => {
  it("rounds to whole percent", () => {
    expect(formatProbability(0.6224)).toBe("62%");
  });

  it("keeps one decimal", () => {
    expect(formatPercent1(0.6224593)).toBe("62.2%");
  });
});
