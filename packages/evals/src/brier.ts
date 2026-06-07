/**
 * Quantitative forecast scoring (Tier 1 of the eval system).
 *
 * Each prediction is a probability assigned to a binary event plus the realized
 * outcome (1 if the event happened, 0 otherwise). These let us grade humans and
 * AI forecaster agents objectively (no LLM needed).
 */

export interface Prediction {
  /** Probability assigned to the event happening, in [0,1]. */
  probability: number;
  /** Realized outcome: 1 if the event happened, else 0. */
  outcome: 0 | 1;
}

function assertNonEmpty(predictions: Prediction[]): void {
  if (predictions.length === 0) throw new Error("evals: need at least one prediction");
}

/** Mean squared error between probability and outcome. Range [0,1], lower is better. */
export function brierScore(predictions: Prediction[]): number {
  assertNonEmpty(predictions);
  const sum = predictions.reduce(
    (acc, p) => acc + (p.probability - p.outcome) ** 2,
    0,
  );
  return sum / predictions.length;
}

/** Log loss (cross-entropy). Lower is better. Clamps to avoid log(0). */
export function logLoss(predictions: Prediction[], eps = 1e-15): number {
  assertNonEmpty(predictions);
  const sum = predictions.reduce((acc, p) => {
    const clamped = Math.min(1 - eps, Math.max(eps, p.probability));
    return acc + (p.outcome === 1 ? -Math.log(clamped) : -Math.log(1 - clamped));
  }, 0);
  return sum / predictions.length;
}

export interface CalibrationBin {
  /** Lower edge of the bin (inclusive). */
  lower: number;
  /** Upper edge of the bin (exclusive, except the last bin which is inclusive). */
  upper: number;
  count: number;
  meanPredicted: number;
  observedFrequency: number;
}

/** Group predictions into equal-width probability bins for a calibration curve. */
export function calibrationBins(predictions: Prediction[], bins = 10): CalibrationBin[] {
  assertNonEmpty(predictions);
  const result: CalibrationBin[] = [];
  for (let i = 0; i < bins; i++) {
    const lower = i / bins;
    const upper = (i + 1) / bins;
    const inBin = predictions.filter((p) =>
      i === bins - 1
        ? p.probability >= lower && p.probability <= upper
        : p.probability >= lower && p.probability < upper,
    );
    const count = inBin.length;
    const meanPredicted =
      count > 0 ? inBin.reduce((a, p) => a + p.probability, 0) / count : 0;
    const observedFrequency =
      count > 0 ? inBin.reduce((a, p) => a + p.outcome, 0) / count : 0;
    result.push({ lower, upper, count, meanPredicted, observedFrequency });
  }
  return result;
}

/** Expected Calibration Error: count-weighted gap between predicted and observed. */
export function calibrationError(predictions: Prediction[], bins = 10): number {
  const n = predictions.length;
  assertNonEmpty(predictions);
  return calibrationBins(predictions, bins).reduce(
    (acc, b) =>
      acc + (b.count / n) * Math.abs(b.observedFrequency - b.meanPredicted),
    0,
  );
}
