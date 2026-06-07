import { describe, it, expect } from "vitest";
import {
  brierScore,
  logLoss,
  calibrationBins,
  calibrationError,
  type Prediction,
} from "../src/brier";

describe("brierScore", () => {
  it("is 0 for a perfect forecaster", () => {
    const preds: Prediction[] = [
      { probability: 1, outcome: 1 },
      { probability: 0, outcome: 0 },
    ];
    expect(brierScore(preds)).toBe(0);
  });

  it("is 0.25 for an always-0.5 forecaster", () => {
    const preds: Prediction[] = [
      { probability: 0.5, outcome: 1 },
      { probability: 0.5, outcome: 0 },
    ];
    expect(brierScore(preds)).toBeCloseTo(0.25, 10);
  });

  it("penalizes confident wrong predictions heavily", () => {
    const confidentWrong = brierScore([{ probability: 0.99, outcome: 0 }]);
    const unsure = brierScore([{ probability: 0.5, outcome: 0 }]);
    expect(confidentWrong).toBeGreaterThan(unsure);
  });
});

describe("logLoss", () => {
  it("is near 0 for a perfect forecaster", () => {
    expect(
      logLoss([
        { probability: 1, outcome: 1 },
        { probability: 0, outcome: 0 },
      ]),
    ).toBeCloseTo(0, 6);
  });

  it("equals -ln(0.5) for always-0.5", () => {
    expect(
      logLoss([
        { probability: 0.5, outcome: 1 },
        { probability: 0.5, outcome: 0 },
      ]),
    ).toBeCloseTo(Math.log(2), 6);
  });
});

describe("calibration", () => {
  it("produces the requested number of bins", () => {
    const preds: Prediction[] = [
      { probability: 0.05, outcome: 0 },
      { probability: 0.95, outcome: 1 },
    ];
    expect(calibrationBins(preds, 10)).toHaveLength(10);
  });

  it("reports ~0 calibration error for a perfectly calibrated set", () => {
    // 10 preds at 0.5 where exactly half resolve YES.
    const preds: Prediction[] = [];
    for (let i = 0; i < 10; i++) {
      preds.push({ probability: 0.5, outcome: i < 5 ? 1 : 0 });
    }
    expect(calibrationError(preds, 10)).toBeCloseTo(0, 10);
  });

  it("detects miscalibration", () => {
    // Predicts 0.9 but the event never happens.
    const preds: Prediction[] = Array.from({ length: 10 }, () => ({
      probability: 0.9,
      outcome: 0 as const,
    }));
    expect(calibrationError(preds, 10)).toBeCloseTo(0.9, 10);
  });
});
