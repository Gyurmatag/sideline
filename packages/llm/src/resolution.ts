import { generateObject } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";

/**
 * AI-assisted resolution. The organizer's manual result stays the source of
 * truth — this only SUGGESTS which outcome occurred (with reasoning + confidence)
 * for the organizer to confirm.
 */
export interface ResolutionContext {
  question: string;
  outcomeLabels: string[];
  /** Optional organizer notes / source text to ground the decision. */
  evidence?: string;
}

export const ResolutionSchema = z.object({
  winner: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(1000),
});
export type ResolutionSuggestion = z.infer<typeof ResolutionSchema>;

export const RESOLVER_SYSTEM =
  "You are resolving a play-money prediction market. Given the question, the possible outcomes, " +
  "and any evidence provided, decide which single outcome occurred. Choose exactly one of the " +
  "provided outcome labels. If you are unsure, pick your best guess but report low confidence.";

export function buildResolutionPrompt(ctx: ResolutionContext): string {
  const lines = [
    `Question: ${ctx.question}`,
    `Possible outcomes: ${ctx.outcomeLabels.join(", ")}`,
  ];
  if (ctx.evidence && ctx.evidence.trim().length > 0) {
    lines.push(`Evidence / organizer notes: ${ctx.evidence.trim()}`);
  }
  lines.push(
    "Which outcome occurred? Reply with the exact winning label, a confidence in [0,1], and brief reasoning.",
  );
  return lines.join("\n");
}

/** Map a model's winner string to a valid outcome label (case-insensitive), or null. */
export function normalizeWinner(winner: string, labels: string[]): string | null {
  const target = winner.trim().toUpperCase();
  return labels.find((l) => l.toUpperCase() === target) ?? null;
}

export interface ResolutionResult extends ResolutionSuggestion {
  /** Whether `winner` matched a real outcome label. */
  valid: boolean;
}

export async function suggestResolution(
  model: LanguageModel,
  ctx: ResolutionContext,
): Promise<ResolutionResult> {
  const { object } = await generateObject({
    model,
    schema: ResolutionSchema,
    system: RESOLVER_SYSTEM,
    prompt: buildResolutionPrompt(ctx),
  });
  const normalized = normalizeWinner(object.winner, ctx.outcomeLabels);
  return {
    winner: normalized ?? object.winner,
    confidence: object.confidence,
    reasoning: object.reasoning,
    valid: normalized !== null,
  };
}
