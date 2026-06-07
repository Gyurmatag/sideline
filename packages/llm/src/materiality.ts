import type { Tier } from "./models";

/**
 * Tier selection: spend the frontier model only on "material" moments
 * (big probability swings or near close), cheap model otherwise.
 */
export interface MaterialityInput {
  /** Absolute change in probability since the agent's last forecast (0..1). */
  priceChange: number;
  /** Seconds remaining until the market closes. */
  secondsToClose: number;
  /** Force the frontier tier regardless (e.g. resolution-critical calls). */
  forced?: boolean;
}

export interface MaterialityConfig {
  priceChangeThreshold: number;
  nearCloseSeconds: number;
}

export const DEFAULT_MATERIALITY: MaterialityConfig = {
  priceChangeThreshold: 0.08,
  nearCloseSeconds: 300,
};

export function selectTier(
  input: MaterialityInput,
  cfg: MaterialityConfig = DEFAULT_MATERIALITY,
): Tier {
  if (input.forced) return "frontier";
  if (Math.abs(input.priceChange) >= cfg.priceChangeThreshold) return "frontier";
  if (input.secondsToClose <= cfg.nearCloseSeconds) return "frontier";
  return "cheap";
}
