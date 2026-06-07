# Sideline

White-label, multi-tenant, **real-time prediction market** for events and hackathons. Attendees trade **play money** on live questions ("will the demo work on the first try?"); an LMSR market maker prices every trade and the new odds stream to every screen instantly via SpacetimeDB. AI agents provide liquidity, post transparent forecasts, and trade on them — and you can watch it all on a big-screen leaderboard.

> **Play money only. No cash-out, no KYC. Not gambling.**

## Live

- App + demo market: **https://sideline-agentb-web.cfi-ops.workers.dev/e/demo**
- Big-screen / projector view: **https://sideline-agentb-web.cfi-ops.workers.dev/e/demo/screen**
- SpacetimeDB: `sideline-agentb` (Maincloud)

The demo market is self-running: a scheduled reducer keeps it alive 24/7 and AI forecasters (OpenAI + Gemini) post reasoning and trade.

## How it works

```
Browser (Next.js client) ──WebSocket──┐
Big screen ───────────────WebSocket──┤        SpacetimeDB module (sideline-agentb)
AI agents (Node/SDK) ─────WebSocket──┼──────▶  • tables (public + private)
                                      │         • place_trade  ← LMSR pricing engine (a reducer)
Cloudflare Workers (OpenNext) serves  │         • resolve_market + payout
the web app + hosts the agents        │         • tick_markets (scheduled, no client needed)
                                      │         • register_agent / post_agent_feed
AI agents ─▶ Vercel AI SDK ─▶ OpenAI / Gemini / Anthropic (forecasts + LLM-as-judge evals)
```

- **The pricing engine is a SpacetimeDB reducer.** `place_trade` recomputes the LMSR price transactionally, updates shares/positions/balance, appends price history, and the new probability streams to every subscribed client.
- **Reducers never call the network.** All LLM calls and external fetches happen in the agents (Node/Workers), never in the sandboxed WASM module.
- **Markets never go dead.** A scheduled reducer (`tick_markets`) runs with no client connected — a gentle liquidity maker keeps prices alive and snapshots history.
- **Transparent AI.** Forecaster agents post a probability + reasoning to a live feed, then trade their edge. A multi-tier eval system scores them (Brier/calibration) and uses a cross-model LLM-as-judge ensemble.

## Stack

- **SpacetimeDB 2.4** — TypeScript module (`spacetimedb/server`), client via `spacetimedb/react`.
- **Next.js 15 + shadcn/ui + Vercel AI Elements** on **Cloudflare Workers** via `@opennextjs/cloudflare`.
- **AI agents** in `workers/agents` connecting over the SpacetimeDB SDK.
- **Vercel AI SDK** across **OpenAI / Gemini / Anthropic** (`packages/llm`) + a multi-tier eval system (`packages/evals`).
- **Vitest** (unit/integration) + **Playwright** (E2E). pnpm workspaces, Node 22.

## Repo layout

```
apps/web/            Next.js 15 frontend (market, big-screen, marketing)
packages/module/     SpacetimeDB module — LMSR, lifecycle, scheduled tick, agents
packages/llm/        Multi-provider LLM layer (tiered routing, cost guards, forecasting)
packages/evals/      Brier/calibration + cross-model LLM-as-judge ensemble
workers/agents/      AI forecaster + liquidity agents
```

## Develop

```bash
pnpm install
pnpm -r test                      # unit/integration (module, web, llm, evals, agents)
pnpm --filter @sideline/web dev   # web app
pnpm --filter @sideline/web test:e2e

# SpacetimeDB module
cd packages/module && spacetime build && spacetime publish --server maincloud --yes sideline-agentb
spacetime generate --lang typescript --module-path spacetimedb --out-dir ../../apps/web/src/module_bindings

# Run an AI forecaster (needs OPENAI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY in .dev.vars)
AGENT_PROVIDER=openai AGENT_NAME=Oracle pnpm --filter @sideline/agents forecaster

# Deploy web to Cloudflare
pnpm --filter @sideline/web cf:deploy
```

Secrets live in a gitignored `.dev.vars` (LLM keys are server-side only — never in `NEXT_PUBLIC_*` or reducers).

## How this maps to the judging criteria

- **Technical implementation** — LMSR market maker as a transactional reducer; real-time subscriptions; scheduled reducers; multi-provider LLM layer; quantitative + LLM-judge eval system.
- **Creativity & originality** — transparent AI forecasters that reason + trade on camera; a calibration/Brier scoreboard for AI vs humans.
- **Impact & usefulness** — a white-label engagement product organizers can deploy at any event; play-money keeps it frictionless and non-gambling.
- **Design & UX** — ElevenLabs-style shadcn UI + Vercel AI Elements; a projector-ready big-screen view.
- **Sponsor-tech integration** — SpacetimeDB (core), Cloudflare (Workers/DO/AI Gateway), Anthropic/Claude + Vercel AI SDK.
- **Completeness** — full loop: trade → AI reasoning → resolve → play-money payout → leaderboard, with tests + CI + live deploys.
- **Demo quality** — always-live market (no dead markets), two-client live price-move proof, deterministic seedable demo.
