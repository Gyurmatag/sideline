"use client";

import { useMemo } from "react";
import { Bot, Sparkles } from "lucide-react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";

import { tables } from "@/src/module_bindings";
import { pricesFromQ } from "@/lib/spacetime";
import { netWorths } from "@/lib/leaderboard";
import { formatPlayMoney, formatProbability, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Big-screen spectator/projector view. Dark, high-contrast, large type, fully
 * live via SpacetimeDB subscriptions. Designed to be cast to a venue projector
 * or embedded in an iframe.
 */
export function ScreenBoard({ eventSlug }: { eventSlug: string }) {
  const { isActive } = useSpacetimeDB();
  const [markets] = useTable(tables.markets.where((r) => r.eventId.eq(eventSlug)));
  const [outcomes] = useTable(tables.outcomes);
  const [positions] = useTable(tables.positions);
  const [users] = useTable(tables.users);
  const [agents] = useTable(tables.agents.where((r) => r.eventId.eq(eventSlug)));
  const [feed] = useTable(tables.agent_feed.where((r) => r.eventId.eq(eventSlug)));

  const featured = useMemo(() => {
    const sorted = markets
      .slice()
      .sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
    return sorted.find((m) => m.status === "open") ?? sorted[0];
  }, [markets]);

  const priceByOutcome = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of markets) {
      const outs = outcomes
        .filter((o) => o.marketId === m.id)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      const prices = pricesFromQ(
        outs.map((o) => o.q),
        m.b,
      );
      outs.forEach((o, i) => map.set(o.id.toString(), prices[i] ?? 0));
    }
    return map;
  }, [markets, outcomes]);

  const featuredOutcomes = useMemo(() => {
    if (!featured) return [];
    return outcomes
      .filter((o) => o.marketId === featured.id)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((o) => ({ label: o.label, prob: priceByOutcome.get(o.id.toString()) ?? 0 }));
  }, [featured, outcomes, priceByOutcome]);

  const agentName = useMemo(
    () => new Map(agents.map((a) => [a.identity.toHexString(), a.name])),
    [agents],
  );

  const ranked = useMemo(
    () =>
      netWorths(
        users.map((u) => {
          const hex = u.identity.toHexString();
          const name = agentName.get(hex);
          return {
            hex,
            balance: u.balance,
            name: name ?? `Trader ${hex.slice(0, 4)}`,
            isAgent: name !== undefined,
          };
        }),
        positions.map((p) => ({
          ownerHex: p.owner.toHexString(),
          outcomeId: p.outcomeId.toString(),
          shares: p.shares,
        })),
        priceByOutcome,
      ).slice(0, 10),
    [users, positions, priceByOutcome, agentName],
  );

  const latestForecast = useMemo(
    () =>
      feed
        .slice()
        .sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0))
        .find((f) => f.kind === "forecast"),
    [feed],
  );

  const yes = featuredOutcomes[0]?.prob ?? 0;

  return (
    <div className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 -top-1/3 -z-0 mx-auto h-[700px] max-w-6xl rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(99,102,241,0.25),transparent_70%)] blur-2xl"
      />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-10 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 text-lg font-bold shadow-lg">
              S
            </span>
            <span className="text-2xl font-semibold tracking-tight">Sideline</span>
          </div>
          <div className="text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-white/40">
              Live event market
            </div>
            <div className="text-2xl font-semibold capitalize">{eventSlug}</div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium">
            <span
              className={cn(
                "size-2 rounded-full",
                isActive ? "animate-pulse bg-emerald-400" : "bg-white/30",
              )}
            />
            {isActive ? "LIVE" : "Connecting…"}
          </div>
        </header>

        <div className="mt-8 grid flex-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Featured market */}
          <section className="flex flex-col">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10">
              <div className="text-sm uppercase tracking-[0.2em] text-indigo-300">
                Featured market
              </div>
              <h1 className="mt-3 text-balance text-5xl font-semibold leading-tight">
                {featured?.question ?? "Waiting for a market…"}
              </h1>

              <div className="mt-10 flex items-end justify-between">
                <div>
                  <div className="text-[10rem] font-bold leading-none tabular-nums text-emerald-400">
                    {formatProbability(yes)}
                  </div>
                  <div className="mt-2 text-2xl text-white/50">YES</div>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold tabular-nums text-white/70">
                    {formatProbability(1 - yes)}
                  </div>
                  <div className="mt-1 text-xl text-white/40">NO</div>
                </div>
              </div>

              <div className="mt-8 h-4 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${Math.round(yes * 100)}%` }}
                />
              </div>
            </div>

            {/* AI desk */}
            <div className="mt-8 flex-1 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center gap-2 text-lg font-semibold text-indigo-300">
                <Sparkles className="size-5" /> AI desk
              </div>
              {latestForecast ? (
                <div className="mt-4">
                  <div className="flex items-center gap-3 text-xl">
                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-semibold">
                      {initials(latestForecast.agentName)}
                    </span>
                    <span className="font-semibold">{latestForecast.agentName}</span>
                    <span className="text-indigo-300">
                      {formatProbability(latestForecast.probability)} YES
                    </span>
                    <span className="ml-auto text-sm text-white/40">
                      {timeAgo(latestForecast.ts.toDate())}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl leading-relaxed text-white/80">
                    “{latestForecast.reasoning}”
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xl text-white/40">
                  AI forecasters will post live reasoning here.
                </p>
              )}
            </div>
          </section>

          {/* Leaderboard */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-lg font-semibold uppercase tracking-[0.2em] text-amber-300">
              Leaderboard
            </h2>
            <ol className="mt-6 space-y-3">
              {ranked.map((r, i) => (
                <li
                  key={r.hex}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl px-4 py-3",
                    i === 0 ? "bg-amber-400/10" : "bg-white/[0.02]",
                  )}
                >
                  <span className="w-6 text-center text-xl font-bold tabular-nums text-white/40">
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-sm font-semibold",
                      r.isAgent
                        ? "bg-gradient-to-br from-indigo-500 to-violet-500"
                        : "bg-gradient-to-br from-slate-500 to-slate-700",
                    )}
                  >
                    {initials(r.name)}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-xl font-medium">
                    {r.name}
                    {r.isAgent && <Bot className="size-4 text-indigo-300" />}
                  </span>
                  <span className="shrink-0 text-xl font-semibold tabular-nums">
                    {formatPlayMoney(r.net, "")}
                  </span>
                </li>
              ))}
              {ranked.length === 0 && (
                <li className="text-white/40">No traders yet.</li>
              )}
            </ol>
          </section>
        </div>

        <footer className="mt-8 flex items-center justify-between text-sm text-white/40">
          <span>Play money only · not gambling</span>
          <span className="uppercase tracking-[0.2em]">
            Trade live · /e/{eventSlug}
          </span>
        </footer>
      </div>
    </div>
  );
}
