/**
 * Pure net-worth ranking (no React/STDB imports) so it is unit-tested.
 * Net worth = play-money balance + mark-to-market value of open positions
 * (shares x current LMSR price).
 */

export interface TraderInput {
  hex: string;
  balance: number;
  name: string;
  isAgent: boolean;
  isMe?: boolean;
}

export interface PositionInput {
  ownerHex: string;
  outcomeId: string;
  shares: number;
}

export interface RankedTrader extends TraderInput {
  net: number;
}

export function netWorths(
  traders: TraderInput[],
  positions: PositionInput[],
  priceByOutcome: Map<string, number>,
): RankedTrader[] {
  return traders
    .map((t) => {
      const posValue = positions
        .filter((p) => p.ownerHex === t.hex)
        .reduce(
          (sum, p) => sum + p.shares * (priceByOutcome.get(p.outcomeId) ?? 0),
          0,
        );
      return { ...t, net: t.balance + posValue };
    })
    .sort((a, b) => b.net - a.net);
}
