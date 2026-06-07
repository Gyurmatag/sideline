# Sideline

White-label, multi-tenant, real-time event prediction market. Attendees trade **play money** on live markets about an event; prices update live for everyone via SpacetimeDB. AI agents provide liquidity, post transparent forecasts, and help resolve markets.

> Play money only. No cash-out, no KYC. Not gambling.

## Stack

- **SpacetimeDB 2.4** — TypeScript module (tables + reducers); the LMSR pricing engine is a reducer.
- **Next.js 15** (App Router) on **Cloudflare Workers** via `@opennextjs/cloudflare`.
- **Cloudflare Durable Objects + Workers** — AI agents (liquidity, forecaster, resolver).
- **Claude** via Cloudflare AI Gateway (tiered + cached).
- **Vitest** (unit/integration) + **Playwright** (E2E). CI/CD via GitHub Actions.

## Workspace layout

```
apps/web/         Next.js 15 frontend (OpenNext -> Cloudflare Workers)
packages/module/  SpacetimeDB module (tables, reducers, LMSR)
packages/bindings/ Generated SpacetimeDB client bindings
workers/agents/   Cloudflare Workers + Durable Objects (AI agents)
e2e/              Playwright end-to-end tests
```

## Develop

```bash
pnpm install
pnpm dev        # run the web app
pnpm test       # unit/integration
pnpm typecheck
```
