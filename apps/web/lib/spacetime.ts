/**
 * SpacetimeDB connection config. These are public (the browser connects
 * directly over WebSocket), so defaults are safe to ship in the bundle.
 */
export const SPACETIME_URI =
  process.env.NEXT_PUBLIC_SPACETIMEDB_URI ?? "wss://maincloud.spacetimedb.com";

export const SPACETIME_DB =
  process.env.NEXT_PUBLIC_SPACETIMEDB_DB ?? "sideline-agentb";

export const STDB_TOKEN_KEY = "sideline_stdb_token";

/** Agents Worker (AI forecaster + resolver suggestions), called over HTTP. */
export const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ??
  "https://sideline-agentb-agents.cfi-ops.workers.dev";

/** Implied probabilities from an LMSR share vector (display-only mirror of the module). */
export function pricesFromQ(qs: number[], b: number): number[] {
  if (qs.length === 0) return [];
  const max = Math.max(...qs);
  const exps = qs.map((q) => Math.exp((q - max) / b));
  const sum = exps.reduce((a, c) => a + c, 0);
  return exps.map((e) => e / sum);
}
