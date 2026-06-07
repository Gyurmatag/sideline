import { describe, it, expect } from "vitest";
import {
  runForecast,
  getLanguageModel,
  resolveModel,
  type ProviderEnv,
  type MarketState,
} from "../src";

// Live calls cost tokens + need network, so they are OFF by default and skipped
// in CI. Run on demand:  RUN_LLM_SMOKE=1 (with keys in env) pnpm --filter @sideline/llm test
const RUN = !!process.env.RUN_LLM_SMOKE;

const env: ProviderEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};

const market: MarketState = {
  question: "Will the live demo work on the first try?",
  outcomes: [
    { label: "YES", probability: 0.62 },
    { label: "NO", probability: 0.38 },
  ],
  closesInSeconds: 600,
};

describe("live multi-provider forecast smoke", () => {
  it.skipIf(!RUN)(
    "OpenAI returns a normalized, structured forecast",
    async () => {
      const model = getLanguageModel(resolveModel("openai", "cheap"), env);
      const { forecast } = await runForecast(model, market);
      const sum = forecast.probabilities.reduce((a, c) => a + c.probability, 0);
      expect(sum).toBeCloseTo(1, 6);
      expect(forecast.reasoning.length).toBeGreaterThan(0);
      console.log("[OpenAI]", JSON.stringify(forecast));
    },
    30_000,
  );

  it.skipIf(!RUN)(
    "Gemini returns a normalized, structured forecast",
    async () => {
      const model = getLanguageModel(resolveModel("google", "cheap"), env);
      const { forecast } = await runForecast(model, market);
      const sum = forecast.probabilities.reduce((a, c) => a + c.probability, 0);
      expect(sum).toBeCloseTo(1, 6);
      expect(forecast.reasoning.length).toBeGreaterThan(0);
      console.log("[Gemini]", JSON.stringify(forecast));
    },
    30_000,
  );
});
