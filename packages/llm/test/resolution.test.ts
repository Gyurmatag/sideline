import { describe, it, expect } from "vitest";
import { buildResolutionPrompt, normalizeWinner } from "../src/resolution";

describe("buildResolutionPrompt", () => {
  it("includes question, outcomes, and optional evidence", () => {
    const p = buildResolutionPrompt({
      question: "Did it rain?",
      outcomeLabels: ["YES", "NO"],
      evidence: "The match was cancelled due to rain.",
    });
    expect(p).toContain("Did it rain?");
    expect(p).toContain("YES, NO");
    expect(p).toContain("cancelled due to rain");
  });

  it("omits the evidence line when none is given", () => {
    const p = buildResolutionPrompt({ question: "Q?", outcomeLabels: ["YES", "NO"] });
    expect(p).not.toContain("Evidence");
  });
});

describe("normalizeWinner", () => {
  it("matches a label case-insensitively", () => {
    expect(normalizeWinner("yes", ["YES", "NO"])).toBe("YES");
    expect(normalizeWinner("  No ", ["YES", "NO"])).toBe("NO");
  });

  it("returns null for an invalid winner", () => {
    expect(normalizeWinner("maybe", ["YES", "NO"])).toBeNull();
  });
});
