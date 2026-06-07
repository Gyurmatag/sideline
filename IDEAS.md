# Sideline — Ideas backlog (living doc)

The win-the-hackathon engine. Each slice ends with a research + ideation pass; new ideas land here, get validated, then ship as their own tested + deployed slice. Never trade a green, deployable `main` for half-built work. Flag anything touching real money / billing for explicit approval.

Idea block schema:
`id` · date · idea · source/evidence · value(H/M/L) · effort(H/M/L) · win-impact(wow|demo|tech-depth|sponsor-fit|business) · status(idea|validated|building|shipped|parked|killed) · decision

Winning-criteria hypotheses (refine as real judging info surfaces):
- Live multiplayer "wow": prices move for everyone on camera.
- AI showcase: transparent forecaster reasoning + trading live.
- Real product/business: multi-tenant white-label, sellable to organizers (e.g. FOMO).
- Technical depth: LMSR-as-a-reducer on SpacetimeDB realtime.
- Polish + reliability: always-live demo, no dead markets.

---

## Backlog (prioritized seed)

- `idea-001` · 2026-06-06 · Sponsor-funded liquidity subsidies (sponsor boosts a market's LMSR `b` / adds play liquidity) · evidence: Manifold subsidies + our sponsor model · value:H effort:M · win-impact:sponsor-fit,business · status:idea · decision:backlog
- `idea-002` · 2026-06-06 · Market templates per event type (hackathon/conference/sports) for instant setup · evidence: Slido/Mentimeter template UX · value:H effort:L · win-impact:business,demo · status:idea · decision:backlog
- `idea-003` · 2026-06-06 · Calibration / Brier-score scoreboard for forecaster agents + humans · evidence: Manifold calibration page · value:M effort:M · win-impact:tech-depth,wow · status:idea · decision:backlog
- `idea-004` · 2026-06-06 · Slack/Discord bot for market alerts + trading (B2B engagement vs Slido) · value:H effort:M · win-impact:business,sponsor-fit · status:idea · decision:backlog
- `idea-005` · 2026-06-06 · "Create a market from a prompt" via Claude (organizer types a question, AI sets outcomes + close time) · value:M effort:M · win-impact:wow,demo · status:idea · decision:backlog
- `idea-006` · 2026-06-06 · CSV/PDF post-event analytics export for organizers · value:H effort:L · win-impact:business · status:idea · decision:backlog
- `idea-007` · 2026-06-06 · Comments / emoji reactions on markets (social layer) · value:M effort:L · win-impact:wow · status:idea · decision:backlog
- `idea-008` · 2026-06-06 · Achievements / streaks / badges for attendees · value:M effort:L · win-impact:wow · status:idea · decision:backlog
- `idea-009` · 2026-06-06 · Anti-manipulation: per-market position limits + wash-trade detection · value:M effort:M · win-impact:tech-depth · status:idea · decision:backlog
- `idea-010` · 2026-06-06 · White-label custom domains per organizer · value:H effort:M · win-impact:business · status:idea · decision:backlog
- `idea-011` · 2026-06-06 · PWA + "market closing soon" push notifications · value:H effort:M · win-impact:wow · status:idea · decision:backlog
- `idea-012` · 2026-06-06 · i18n / multi-language attendee UI · value:L effort:M · win-impact:business · status:idea · decision:backlog
- `idea-013` · 2026-06-06 · Multi-tier, multi-provider LLM eval system (OpenAI + Gemini + Anthropic via Vercel AI SDK): forecaster agents run across model tiers/providers; an eval harness scores predictions (Brier/calibration vs resolved outcomes + LLM-as-judge) and surfaces a model scoreboard in the reasoning feed + dashboard · source: user request · value:H effort:M · win-impact:tech-depth,wow,demo · status:building · decision:build-now (integrated into the agent slices 5/6)

## Parked (need explicit approval — real money / regulated / billing)

- `parked-001` · Charity cash-out path (regulated; converts play winnings to charity donations) · status:parked · decision: DO NOT BUILD without explicit sign-off
- `parked-002` · Org billing / Stripe subscription tiers · status:parked · decision: DO NOT BUILD without explicit sign-off

## Research pass — 2026-06-07 (Manifold/Polymarket engagement teardown)

Evidence: Manifold's engagement is driven by (a) **comments/discussion** on each market ("information sharing", explains why probabilities move), (b) **achievements / streaks / leagues / badges**, (c) **calibration tracking** ("when you say 70%, does it happen 70%?"), and (d) **reputation/leaderboard status** as the core motivator (play-money, so accuracy > profit). Validated next ideas:

- `idea-014` · 2026-06-07 · **AI calibration scoreboard** — surface our eval system (Brier/calibration) in-product for the AI forecasters (and humans) over resolved markets. Unique vs competitors (nobody shows *AI* calibration), leverages `packages/evals`, reinforces "transparent AI". · value:H effort:M · win-impact:tech-depth,wow,creativity · status:validated · decision:build-next
- `idea-015` · 2026-06-07 · **Market comments / reactions** — social discussion layer (Manifold's top engagement driver); attendees + agents post takes. · value:H effort:M · win-impact:wow,business · status:validated · decision:backlog
- `idea-016` · 2026-06-07 · **Achievements + streaks** (e.g. "called it" on a <10% market, daily streak) — gamified retention. · value:M effort:M · win-impact:wow · status:validated · decision:backlog
- `idea-017` · 2026-06-07 · **QR-to-join** on the market + big-screen views — frictionless venue onboarding. · value:H effort:L · win-impact:demo,business · status:validated · decision:backlog

## Shipped

- `slice-0` · 2026-06-06 · Monorepo + Next 15/OpenNext on Cloudflare + CI + green tests
- `slice-1` · 2026-06-06 · LMSR pricing engine (reducer) + live multiplayer trade UI
- `llm+evals` · 2026-06-07 · Multi-provider LLM layer + multi-tier eval system (merged to main, PR #2)
- `agents` · 2026-06-07 · Liquidity maker (scheduled reducer) + LLM forecaster (Node + **deployed cron Worker**, 24/7)
- `lifecycle` · 2026-06-07 · resolve_market + play-money payout + resolved/winner UI
- `always-live` · 2026-06-07 · scheduled tick keeps markets alive with no client connected
- `ui` · 2026-06-07 · AI desk (Vercel AI Elements), live leaderboard, Your-positions, per-event branding
- `spectator` · 2026-06-07 · big-screen projector view /e/[slug]/screen
- `multi-tenant` · 2026-06-07 · self-serve /create (white-label event + market), join via link
- `analytics` · 2026-06-07 · organizer dashboard /e/[slug]/analytics (KPIs + recharts)
