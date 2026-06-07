import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { ModelSpec, Provider } from "./models";

/**
 * Server-side provider env. These keys NEVER reach the browser or reducers —
 * only Workers/Durable Objects (and tests) read them.
 */
export interface ProviderEnv {
  OPENAI_API_KEY?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  /** Optional Cloudflare AI Gateway routing (caching, rate-limit, analytics). */
  AI_GATEWAY_ACCOUNT_ID?: string;
  AI_GATEWAY_ID?: string;
}

const GATEWAY_SLUGS: Record<Provider, string> = {
  openai: "openai",
  google: "google-ai-studio",
  anthropic: "anthropic",
};

/** Build a Cloudflare AI Gateway base URL for a provider, or undefined if not configured. */
export function gatewayBaseUrl(
  provider: Provider,
  env: ProviderEnv,
): string | undefined {
  if (!env.AI_GATEWAY_ACCOUNT_ID || !env.AI_GATEWAY_ID) return undefined;
  return `https://gateway.ai.cloudflare.com/v1/${env.AI_GATEWAY_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/${GATEWAY_SLUGS[provider]}`;
}

/** Resolve an AI SDK LanguageModel for a provider/model, optionally via AI Gateway. */
export function getLanguageModel(spec: ModelSpec, env: ProviderEnv): LanguageModel {
  const baseURL = gatewayBaseUrl(spec.provider, env);
  switch (spec.provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY, baseURL });
      return openai(spec.model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({
        apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
        baseURL,
      });
      return google(spec.model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL });
      return anthropic(spec.model);
    }
  }
}

/** Which providers actually have a key configured (used to skip unavailable ensemble members). */
export function availableProviders(env: ProviderEnv): Provider[] {
  const out: Provider[] = [];
  if (env.OPENAI_API_KEY) out.push("openai");
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) out.push("google");
  if (env.ANTHROPIC_API_KEY) out.push("anthropic");
  return out;
}
