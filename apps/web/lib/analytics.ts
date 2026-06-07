/** Pure organizer-analytics aggregations (no React/STDB imports) — unit-tested. */

export interface AnalyticsTrade {
  cost: number;
  traderHex: string;
  outcomeId: string;
  isAgent: boolean;
}

export interface EventStats {
  totalTrades: number;
  volume: number;
  uniqueTraders: number;
  humanTrades: number;
  agentTrades: number;
}

export function computeEventStats(trades: AnalyticsTrade[]): EventStats {
  const traders = new Set<string>();
  let volume = 0;
  let agentTrades = 0;
  for (const t of trades) {
    traders.add(t.traderHex);
    volume += Math.abs(t.cost);
    if (t.isAgent) agentTrades += 1;
  }
  return {
    totalTrades: trades.length,
    volume,
    uniqueTraders: traders.size,
    humanTrades: trades.length - agentTrades,
    agentTrades,
  };
}

export interface OutcomeBreakdown {
  label: string;
  count: number;
  volume: number;
}

export function tradesByOutcome(
  trades: AnalyticsTrade[],
  labelOf: (outcomeId: string) => string,
): OutcomeBreakdown[] {
  const map = new Map<string, OutcomeBreakdown>();
  for (const t of trades) {
    const label = labelOf(t.outcomeId);
    const entry = map.get(label) ?? { label, count: 0, volume: 0 };
    entry.count += 1;
    entry.volume += Math.abs(t.cost);
    map.set(label, entry);
  }
  return [...map.values()];
}

/** Cumulative play-money volume over the trade sequence (for an area chart). */
export function cumulativeVolume(orderedTrades: AnalyticsTrade[]): {
  n: number;
  volume: number;
}[] {
  let running = 0;
  return orderedTrades.map((t, i) => {
    running += Math.abs(t.cost);
    return { n: i + 1, volume: Math.round(running) };
  });
}
