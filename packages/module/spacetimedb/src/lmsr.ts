/**
 * Pure LMSR (Logarithmic Market Scoring Rule) automated market maker math.
 *
 * No SpacetimeDB imports — these are deterministic pure functions that are
 * unit-tested directly and also imported by the module's reducers.
 *
 * Cost function:   C(q)   = b * ln( sum_j exp(q_j / b) )
 * Instantaneous price (implied probability) of outcome i:
 *                  p_i(q) = exp(q_i / b) / sum_j exp(q_j / b)
 * Cost to buy d shares of outcome i: C(q + d*e_i) - C(q)
 *
 * All sums use the log-sum-exp trick (subtract the max) for numerical stability.
 */

function assertParams(q: number[], b: number): void {
  if (!(b > 0)) throw new Error("lmsr: liquidity parameter b must be > 0");
  if (q.length === 0) throw new Error("lmsr: need at least one outcome");
}

/** Total cost C(q) of the current share vector. */
export function lmsrCost(q: number[], b: number): number {
  assertParams(q, b);
  const max = Math.max(...q);
  let sum = 0;
  for (const qi of q) sum += Math.exp((qi - max) / b);
  // C = b * ln(sum_j exp(q_j/b)) = max + b*ln(sum_j exp((q_j-max)/b))
  return max + b * Math.log(sum);
}

/** Implied probabilities for each outcome; always sums to 1. */
export function lmsrPrices(q: number[], b: number): number[] {
  assertParams(q, b);
  const max = Math.max(...q);
  const exps = q.map((qi) => Math.exp((qi - max) / b));
  const sum = exps.reduce((a, c) => a + c, 0);
  return exps.map((e) => e / sum);
}

/** Price (implied probability) of a single outcome. */
export function priceOf(q: number[], outcomeIndex: number, b: number): number {
  return lmsrPrices(q, b)[outcomeIndex];
}

/**
 * Cost to buy `shares` of `outcomeIndex` (negative `shares` => sell/refund).
 * The trader pays this amount in play money.
 */
export function costToBuy(
  q: number[],
  outcomeIndex: number,
  shares: number,
  b: number,
): number {
  if (outcomeIndex < 0 || outcomeIndex >= q.length) {
    throw new Error("lmsr: outcomeIndex out of range");
  }
  const before = lmsrCost(q, b);
  const after = q.slice();
  after[outcomeIndex] += shares;
  return lmsrCost(after, b) - before;
}
