/**
 * Per-forecaster calibration (Brier score) over RESOLVED markets — the in-product
 * surface of the eval system. Uses each agent's most recent forecast per market
 * before resolution. Brier = mean((p - outcome)^2); lower is better.
 * Mirrors packages/evals/brier (kept local to avoid pulling the AI SDK into the browser bundle).
 */

export interface ForecastEntry {
  agentName: string;
  marketId: string;
  probabilityYes: number;
}

export interface ResolutionEntry {
  marketId: string;
  yesWon: boolean;
}

export interface AgentCalibration {
  name: string;
  n: number;
  brier: number;
}

export function agentCalibration(
  forecastsChronological: ForecastEntry[],
  resolutions: ResolutionEntry[],
): AgentCalibration[] {
  const resByMarket = new Map(resolutions.map((r) => [r.marketId, r.yesWon]));

  // Keep the latest forecast per (agent, market) on resolved markets.
  const latest = new Map<string, { name: string; p: number; o: number }>();
  for (const f of forecastsChronological) {
    const yesWon = resByMarket.get(f.marketId);
    if (yesWon === undefined) continue;
    latest.set(`${f.agentName}|${f.marketId}`, {
      name: f.agentName,
      p: f.probabilityYes,
      o: yesWon ? 1 : 0,
    });
  }

  const byAgent = new Map<string, { p: number; o: number }[]>();
  for (const v of latest.values()) {
    const arr = byAgent.get(v.name) ?? [];
    arr.push({ p: v.p, o: v.o });
    byAgent.set(v.name, arr);
  }

  const out: AgentCalibration[] = [];
  for (const [name, preds] of byAgent) {
    const brier =
      preds.reduce((s, x) => s + (x.p - x.o) ** 2, 0) / preds.length;
    out.push({ name, n: preds.length, brier });
  }
  return out.sort((a, b) => a.brier - b.brier);
}
