/**
 * Pure play-money settlement math (no SpacetimeDB imports) so it is unit-tested
 * directly. On resolution, each share of the WINNING outcome pays 1 unit; losing
 * shares pay 0 (standard prediction-market settlement).
 */

export interface SettlementPosition {
  /** Identity hex of the position owner. */
  owner: string;
  outcomeId: bigint;
  shares: number;
}

/** Map of owner-hex -> play-money credit owed on resolution. */
export function settleCredits(
  positions: SettlementPosition[],
  winningOutcomeId: bigint,
): Map<string, number> {
  const credits = new Map<string, number>();
  for (const p of positions) {
    if (p.outcomeId === winningOutcomeId && p.shares > 0) {
      credits.set(p.owner, (credits.get(p.owner) ?? 0) + p.shares);
    }
  }
  return credits;
}

/** Final implied prices after resolution: 1 for the winner, 0 for everyone else. */
export function resolvedPrices(
  outcomeIds: bigint[],
  winningOutcomeId: bigint,
): { outcomeId: bigint; prob: number }[] {
  return outcomeIds.map((id) => ({
    outcomeId: id,
    prob: id === winningOutcomeId ? 1 : 0,
  }));
}
