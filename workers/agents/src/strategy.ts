/**
 * Pure agent decision logic (no SpacetimeDB / LLM imports) so it is fully
 * unit-tested. Given the market's current YES probability and the agent's own
 * forecast, decide whether to trade and how much.
 */

export interface TradeDecision {
  outcome: "YES" | "NO";
  shares: number;
}

export interface StrategyOptions {
  /** Minimum edge (|forecast - market|) before the agent bothers to trade. */
  minEdge?: number;
  /** Max shares per trade (risk cap). */
  maxShares?: number;
  /** Shares per unit of edge (edge 0.10 * 100 = 10 shares). */
  sharesPerEdge?: number;
}

const DEFAULTS: Required<StrategyOptions> = {
  minEdge: 0.03,
  maxShares: 25,
  sharesPerEdge: 100,
};

/**
 * Trade toward the agent's forecast: buy YES if it thinks YES is underpriced,
 * buy NO if overpriced. Returns null when the edge is too small to act on.
 */
export function decideTrade(
  marketYes: number,
  forecastYes: number,
  options: StrategyOptions = {},
): TradeDecision | null {
  const opts = { ...DEFAULTS, ...options };
  const edge = forecastYes - marketYes;
  if (!Number.isFinite(edge) || Math.abs(edge) < opts.minEdge) return null;

  const shares = Math.min(opts.maxShares, Math.round(Math.abs(edge) * opts.sharesPerEdge));
  if (shares <= 0) return null;

  return edge > 0 ? { outcome: "YES", shares } : { outcome: "NO", shares };
}

/** Extract the YES probability from a list of outcome probabilities. */
export function yesProbability(
  probabilities: { label: string; probability: number }[],
): number {
  const yes = probabilities.find((p) => p.label.toUpperCase() === "YES");
  return yes ? yes.probability : 0.5;
}

/** LMSR implied probabilities from a share vector (mirror of the module's math). */
export function impliedProbabilities(qs: number[], b: number): number[] {
  if (qs.length === 0) return [];
  const max = Math.max(...qs);
  const exps = qs.map((q) => Math.exp((q - max) / b));
  const sum = exps.reduce((a, c) => a + c, 0);
  return exps.map((e) => e / sum);
}
