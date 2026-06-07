import { describe, it, expect } from "vitest";
import { timeAgo, initials } from "../lib/format";

describe("timeAgo", () => {
  const now = new Date("2026-06-07T12:00:00Z");

  it("says 'just now' for very recent times", () => {
    expect(timeAgo(new Date("2026-06-07T11:59:58Z"), now)).toBe("just now");
  });

  it("formats seconds, minutes, hours, days", () => {
    expect(timeAgo(new Date("2026-06-07T11:59:30Z"), now)).toBe("30s ago");
    expect(timeAgo(new Date("2026-06-07T11:45:00Z"), now)).toBe("15m ago");
    expect(timeAgo(new Date("2026-06-07T09:00:00Z"), now)).toBe("3h ago");
    expect(timeAgo(new Date("2026-06-05T12:00:00Z"), now)).toBe("2d ago");
  });

  it("never goes negative", () => {
    expect(timeAgo(new Date("2026-06-07T12:00:30Z"), now)).toBe("just now");
  });
});

describe("initials", () => {
  it("handles single and multi-word names", () => {
    expect(initials("Oracle")).toBe("OR");
    expect(initials("Oracle GPT")).toBe("OG");
    expect(initials("  ")).toBe("?");
  });
});
