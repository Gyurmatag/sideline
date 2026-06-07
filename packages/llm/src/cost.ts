import type { Provider } from "./models";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/** USD per 1M tokens. */
export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

/** Approximate public pricing; used only for budget guardrails, not billing. */
export const PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10 },
  "gemini-2.5-flash": { inputPerMTok: 0.3, outputPerMTok: 2.5 },
  "gemini-2.5-pro": { inputPerMTok: 1.25, outputPerMTok: 10 },
  "claude-3-5-haiku-latest": { inputPerMTok: 0.8, outputPerMTok: 4 },
  "claude-sonnet-4-latest": { inputPerMTok: 3, outputPerMTok: 15 },
};

const FALLBACK_PRICING: ModelPricing = { inputPerMTok: 1, outputPerMTok: 5 };

export function pricingFor(model: string): ModelPricing {
  return PRICING[model] ?? FALLBACK_PRICING;
}

export function estimateCostUsd(usage: TokenUsage, pricing: ModelPricing): number {
  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMTok +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMTok
  );
}

/**
 * A simple per-event/per-agent spend guard. All LLM calls check `canAfford`
 * before running and `record` actual usage after.
 */
export class CostBudget {
  private spentUsd: number;

  constructor(
    private readonly limitUsd: number,
    initialSpentUsd = 0,
  ) {
    this.spentUsd = initialSpentUsd;
  }

  get spent(): number {
    return this.spentUsd;
  }

  get limit(): number {
    return this.limitUsd;
  }

  get remaining(): number {
    return Math.max(0, this.limitUsd - this.spentUsd);
  }

  canAfford(estimatedUsd: number): boolean {
    return this.spentUsd + estimatedUsd <= this.limitUsd;
  }

  record(usd: number): void {
    this.spentUsd += usd;
  }
}

export type { Provider };
