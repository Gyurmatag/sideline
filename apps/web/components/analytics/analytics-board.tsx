"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Bot, Coins, Users } from "lucide-react";
import { useTable } from "spacetimedb/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { tables } from "@/src/module_bindings";
import { formatPlayMoney } from "@/lib/format";
import {
  computeEventStats,
  cumulativeVolume,
  tradesByOutcome,
  type AnalyticsTrade,
} from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsBoard({ eventSlug }: { eventSlug: string }) {
  const [markets] = useTable(tables.markets.where((r) => r.eventId.eq(eventSlug)));
  const [outcomes] = useTable(tables.outcomes);
  const [trades] = useTable(tables.trades);
  const [agents] = useTable(tables.agents.where((r) => r.eventId.eq(eventSlug)));
  const [events] = useTable(tables.events.where((r) => r.slug.eq(eventSlug)));

  const currency = events[0]?.currencyName ?? "Sideline Bucks";

  const { stats, cumulative, byOutcome } = useMemo(() => {
    const marketIds = new Set(markets.map((m) => m.id.toString()));
    const labelOf = new Map(outcomes.map((o) => [o.id.toString(), o.label]));
    const agentHexes = new Set(agents.map((a) => a.identity.toHexString()));

    const eventTrades = trades
      .filter((t) => marketIds.has(t.marketId.toString()))
      .slice()
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const analytics: AnalyticsTrade[] = eventTrades.map((t) => ({
      cost: t.cost,
      traderHex: t.trader.toHexString(),
      outcomeId: t.outcomeId.toString(),
      isAgent: agentHexes.has(t.trader.toHexString()),
    }));

    return {
      stats: computeEventStats(analytics),
      cumulative: cumulativeVolume(analytics),
      byOutcome: tradesByOutcome(analytics, (id) => labelOf.get(id) ?? "?"),
    };
  }, [markets, outcomes, trades, agents]);

  const barColors = ["var(--color-success)", "var(--color-muted-foreground)"];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-6">
          <Link
            href={`/e/${eventSlug}`}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back to market"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="text-sm font-semibold leading-tight">
              {events[0]?.name ?? `${eventSlug} event`} · Analytics
            </div>
            <div className="text-xs text-muted-foreground">Organizer dashboard</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={BarChart3} label="Trades" value={stats.totalTrades.toLocaleString()} />
          <Stat icon={Coins} label="Volume" value={formatPlayMoney(stats.volume, currency)} />
          <Stat icon={Users} label="Traders" value={stats.uniqueTraders.toLocaleString()} />
          <Stat
            icon={Bot}
            label="AI vs human trades"
            value={`${stats.agentTrades} / ${stats.humanTrades}`}
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Cumulative trade volume</h2>
            {cumulative.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cumulative} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="n" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} width={48} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-semibold">Trades by outcome</h2>
            {byOutcome.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trades yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byOutcome} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} width={48} />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {byOutcome.map((row, i) => (
                      <Cell key={row.label} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" /> {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
