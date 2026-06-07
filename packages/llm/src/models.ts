/**
 * Provider + tiered model registry.
 *
 * Defaults use models confirmed available on the project's keys (probed via the
 * providers' /models endpoints). Override per deployment via env/config.
 */

export type Provider = "openai" | "google" | "anthropic";

/** Cheap tier for routine ticks; frontier tier for material moves / resolution. */
export type Tier = "cheap" | "frontier";

export interface ModelSpec {
  provider: Provider;
  model: string;
}

export const DEFAULT_TIERS: Record<Provider, Record<Tier, string>> = {
  openai: { cheap: "gpt-4o-mini", frontier: "gpt-4o" },
  google: { cheap: "gemini-2.5-flash", frontier: "gemini-2.5-pro" },
  // Confirmed once the Anthropic key arrives; sensible current defaults for now.
  anthropic: { cheap: "claude-3-5-haiku-latest", frontier: "claude-sonnet-4-latest" },
};

export function resolveModel(
  provider: Provider,
  tier: Tier,
  tiers: Record<Provider, Record<Tier, string>> = DEFAULT_TIERS,
): ModelSpec {
  return { provider, model: tiers[provider][tier] };
}

/** Providers we ensemble across for cross-model evals (judges). */
export const ENSEMBLE_PROVIDERS: Provider[] = ["openai", "google", "anthropic"];
