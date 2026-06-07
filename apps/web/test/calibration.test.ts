import { describe, it, expect } from "vitest";
import { agentCalibration, type ForecastEntry } from "../lib/calibration";

const resolutions = [
  { marketId: "1", yesWon: true },
  { marketId: "2", yesWon: false },
];

describe("agentCalibration", () => {
  it("computes Brier per agent on resolved markets and ranks ascending", () => {
    const forecasts: ForecastEntry[] = [
      { agentName: "Oracle", marketId: "1", probabilityYes: 0.9 }, // (0.9-1)^2=0.01
      { agentName: "Oracle", marketId: "2", probabilityYes: 0.1 }, // (0.1-0)^2=0.01
      { agentName: "Scout", marketId: "1", probabilityYes: 0.4 }, // (0.4-1)^2=0.36
    ];
    const rows = agentCalibration(forecasts, resolutions);
    expect(rows[0].name).toBe("Oracle");
    expect(rows[0].n).toBe(2);
    expect(rows[0].brier).toBeCloseTo(0.01, 10);
    expect(rows[1].name).toBe("Scout");
    expect(rows[1].brier).toBeCloseTo(0.36, 10);
  });

  it("uses the latest forecast per agent+market and ignores unresolved markets", () => {
    const forecasts: ForecastEntry[] = [
      { agentName: "Oracle", marketId: "1", probabilityYes: 0.5 }, // superseded
      { agentName: "Oracle", marketId: "1", probabilityYes: 1.0 }, // latest -> perfect
      { agentName: "Oracle", marketId: "99", probabilityYes: 0.2 }, // unresolved -> ignored
    ];
    const rows = agentCalibration(forecasts, resolutions);
    expect(rows).toHaveLength(1);
    expect(rows[0].n).toBe(1);
    expect(rows[0].brier).toBeCloseTo(0, 10);
  });

  it("returns empty when no forecasts land on resolved markets", () => {
    expect(
      agentCalibration([{ agentName: "X", marketId: "99", probabilityYes: 0.5 }], resolutions),
    ).toEqual([]);
  });
});
