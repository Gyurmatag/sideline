/** Combine independent probability estimates (e.g. from multiple providers) into one. */

export function median(values: number[]): number {
  if (values.length === 0) throw new Error("evals: median of empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function mean(values: number[]): number {
  if (values.length === 0) throw new Error("evals: mean of empty list");
  return values.reduce((a, c) => a + c, 0) / values.length;
}

/**
 * Consensus probability across model forecasts. Median is robust to a single
 * outlier model, which matters for an ensemble of different providers.
 */
export function consensusProbability(probabilities: number[]): number {
  return median(probabilities);
}
