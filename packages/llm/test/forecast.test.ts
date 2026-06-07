import { describe, it, expect } from "vitest";
import {
  buildForecastPrompt,
  normalizeForecast,
  type Forecast,
} from "../src/forecast";

describe("buildForecastPrompt", () => {
  it("includes the question and each outcome with a percent", () => {
    const prompt = buildForecastPrompt({
      question: "Will the keynote run late?",
      outcomes: [
        { label: "YES", probability: 0.62 },
        { label: "NO", probability: 0.38 },
      ],
      closesInSeconds: 600,
    });
    expect(prompt).toContain("Will the keynote run late?");
    expect(prompt).toContain("YES: 62.0%");
    expect(prompt).toContain("NO: 38.0%");
    expect(prompt).toContain("Closes in ~10 minute(s).");
  });
});

describe("normalizeForecast", () => {
  it("renormalizes probabilities to sum to 1", () => {
    const raw: Forecast = {
      probabilities: [
        { label: "YES", probability: 0.6 },
        { label: "NO", probability: 0.6 },
      ],
      reasoning: "balanced",
    };
    const out = normalizeForecast(raw, ["YES", "NO"]);
    const sum = out.probabilities.reduce((a, c) => a + c.probability, 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(out.probabilities[0].probability).toBeCloseTo(0.5, 10);
  });

  it("fills missing labels with a uniform fallback then normalizes", () => {
    const raw: Forecast = {
      probabilities: [{ label: "YES", probability: 0.8 }],
      reasoning: "only gave one",
    };
    const out = normalizeForecast(raw, ["YES", "NO"]);
    expect(out.probabilities.map((p) => p.label)).toEqual(["YES", "NO"]);
    expect(out.probabilities.reduce((a, c) => a + c.probability, 0)).toBeCloseTo(1, 10);
    expect(out.probabilities[0].probability).toBeGreaterThan(
      out.probabilities[1].probability,
    );
  });

  it("clamps out-of-range values defensively", () => {
    const raw = {
      probabilities: [
        { label: "YES", probability: 1.5 },
        { label: "NO", probability: -0.3 },
      ],
      reasoning: "garbage in",
    } as Forecast;
    const out = normalizeForecast(raw, ["YES", "NO"]);
    expect(out.probabilities[0].probability).toBeCloseTo(1, 10);
    expect(out.probabilities[1].probability).toBeCloseTo(0, 10);
  });

  it("uses uniform distribution when everything is zero", () => {
    const raw: Forecast = {
      probabilities: [
        { label: "A", probability: 0 },
        { label: "B", probability: 0 },
        { label: "C", probability: 0 },
      ],
      reasoning: "no signal",
    };
    const out = normalizeForecast(raw, ["A", "B", "C"]);
    for (const p of out.probabilities) expect(p.probability).toBeCloseTo(1 / 3, 10);
  });
});
