import { describe, it, expect } from "vitest";
import { isValidSlug } from "../src/validation";

describe("isValidSlug", () => {
  it("accepts lowercase, numbers, and single hyphens", () => {
    expect(isValidSlug("fomo-hackathon-2026")).toBe(true);
    expect(isValidSlug("demo")).toBe(true);
  });

  it("rejects uppercase, spaces, leading/trailing/double hyphens, and bad length", () => {
    expect(isValidSlug("FOMO")).toBe(false);
    expect(isValidSlug("a b")).toBe(false);
    expect(isValidSlug("-demo")).toBe(false);
    expect(isValidSlug("demo-")).toBe(false);
    expect(isValidSlug("a--b")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
    expect(isValidSlug("x".repeat(41))).toBe(false);
  });
});
