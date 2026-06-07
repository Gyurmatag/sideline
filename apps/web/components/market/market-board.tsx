"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Radio, Wallet } from "lucide-react";
import { useReducer, useSpacetimeDB, useTable } from "spacetimedb/react";
import type { UTCTimestamp } from "lightweight-charts";

import { reducers, tables } from "@/src/module_bindings";
import { pricesFromQ } from "@/lib/spacetime";
import { formatPercent1, formatPlayMoney, formatProbability } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PriceChart, type PricePoint } from "./price-chart";
import { AgentFeed } from "./agent-feed";
import { Leaderboard } from "./leaderboard";

const TRADE_SIZES = [10, 25, 50] as const;

export function MarketBoard({ eventSlug }: { eventSlug: string }) {
  const { identity, isActive } = useSpacetimeDB();
  const [markets, marketsReady] = useTable(
    tables.markets.where((r) => r.eventId.eq(eventSlug)),
  );
  const [outcomes] = useTable(tables.outcomes);
  const [history] = useTable(tables.market_price_history);
  const [trades] = useTable(tables.trades);
  const [users] = useTable(tables.users);
  const [resolutions] = useTable(tables.resolutions);
  const placeTrade = useReducer(reducers.placeTrade);
  const resolveMarket = useReducer(reducers.resolveMarket);

  const [shares, setShares] = useState<number>(10);
  const [pending, setPending] = useState<bigint | null>(null);
  const [resolving, setResolving] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefer the most recent OPEN market so a resolved demo market doesn't stick.
  const market = useMemo(() => {
    const sorted = markets
      .slice()
      .sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0));
    return sorted.find((m) => m.status === "open") ?? sorted[0];
  }, [markets]);

  const marketOutcomes = useMemo(() => {
    if (!market) return [];
    return outcomes
      .filter((o) => o.marketId === market.id)
      .slice()
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }, [outcomes, market]);

  const prices = useMemo(() => {
    if (!market || marketOutcomes.length === 0) return [] as number[];
    return pricesFromQ(
      marketOutcomes.map((o) => o.q),
      market.b,
    );
  }, [marketOutcomes, market]);

  const me = useMemo(
    () => (identity ? users.find((u) => u.identity.isEqual(identity)) : undefined),
    [users, identity],
  );

  const chartPoints = useMemo<PricePoint[]>(() => {
    if (!market || marketOutcomes.length === 0) return [];
    const yesId = marketOutcomes[0].id;
    const rows = history
      .filter((h) => h.marketId === market.id && h.outcomeId === yesId)
      .slice()
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    let last = 0;
    return rows.map((r) => {
      let t = Math.floor(r.ts.toDate().getTime() / 1000);
      if (t <= last) t = last + 1;
      last = t;
      return { time: t as UTCTimestamp, value: r.prob };
    });
  }, [history, market, marketOutcomes]);

  const recentTrades = useMemo(() => {
    if (!market) return [];
    return trades
      .filter((t) => t.marketId === market.id)
      .slice()
      .sort((a, b) => (a.id > b.id ? -1 : a.id < b.id ? 1 : 0))
      .slice(0, 8);
  }, [trades, market]);

  const winningOutcomeId = useMemo(
    () =>
      market
        ? resolutions.find((r) => r.marketId === market.id)?.winningOutcomeId
        : undefined,
    [resolutions, market],
  );

  async function handleBuy(outcomeId: bigint) {
    if (!market) return;
    setError(null);
    setPending(outcomeId);
    try {
      await placeTrade({ marketId: market.id, outcomeId, shares });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setPending(null);
    }
  }

  async function handleResolve(outcomeId: bigint) {
    if (!market) return;
    setError(null);
    setResolving(outcomeId);
    try {
      await resolveMarket({ marketId: market.id, winningOutcomeId: outcomeId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
    } finally {
      setResolving(null);
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar
        eventSlug={eventSlug}
        isActive={isActive}
        balance={me?.balance}
      />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {!marketsReady ? (
          <LoadingState />
        ) : !market ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Market + chart + controls */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Badge variant={market.status === "open" ? "success" : "muted"}>
                      {market.status === "open" ? "Open" : market.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      LMSR market maker · liquidity b={market.b}
                    </span>
                  </div>

                  <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                    {market.question}
                  </h1>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {marketOutcomes.map((o, i) => (
                      <OutcomeTile
                        key={o.id.toString()}
                        label={o.label}
                        prob={prices[i] ?? 0}
                        tone={i === 0 ? "yes" : "no"}
                        disabled={market.status !== "open" || pending !== null}
                        loading={pending === o.id}
                        resolved={market.status === "resolved"}
                        won={o.id === winningOutcomeId}
                        onBuy={() => handleBuy(o.id)}
                      />
                    ))}
                  </div>

                  {error && (
                    <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  {market.status === "resolved" ? (
                    <div className="mt-6 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm">
                      <span className="font-semibold text-success">Resolved</span> —{" "}
                      {marketOutcomes.find((o) => o.id === winningOutcomeId)?.label ??
                        "?"}{" "}
                      won. Winners were paid 1 per share in play money.
                    </div>
                  ) : (
                    <>
                      <div className="mt-6 flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">Trade size</span>
                        <div className="flex items-center gap-1.5">
                          {TRADE_SIZES.map((s) => (
                            <Button
                              key={s}
                              size="sm"
                              variant={shares === s ? "default" : "outline"}
                              onClick={() => setShares(s)}
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
                        <span className="text-xs text-muted-foreground">
                          Organizer · resolve outcome
                        </span>
                        <div className="flex items-center gap-1.5">
                          {marketOutcomes.map((o) => (
                            <Button
                              key={o.id.toString()}
                              size="sm"
                              variant="outline"
                              disabled={resolving !== null}
                              onClick={() => handleResolve(o.id)}
                              data-testid={`resolve-${o.label}`}
                            >
                              {resolving === o.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                `Resolve ${o.label}`
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-semibold">
                      {marketOutcomes[0]?.label ?? "YES"} price history
                    </h2>
                    <span className="text-sm tabular-nums text-success">
                      {formatPercent1(prices[0] ?? 0)}
                    </span>
                  </div>
                  <PriceChart points={chartPoints} />
                </CardContent>
              </Card>

              <AgentFeed eventSlug={eventSlug} />
            </div>

            {/* Side panel */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="size-4" /> Your balance
                  </div>
                  <div className="mt-1 text-3xl font-semibold tabular-nums">
                    {me ? formatPlayMoney(me.balance) : isActive ? "—" : "Connecting…"}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Play money only. No cash-out. Just for fun.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-semibold">
                    <Radio className="size-4 text-success" /> Live trades
                  </h2>
                  {recentTrades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No trades yet — be the first to move the market.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {recentTrades.map((t) => {
                        const o = marketOutcomes.find((x) => x.id === t.outcomeId);
                        const mine = identity && t.trader.isEqual(identity);
                        return (
                          <li
                            key={t.id.toString()}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="flex items-center gap-2">
                              <Badge
                                variant={o?.label === "YES" ? "success" : "muted"}
                                className="w-12 justify-center"
                              >
                                {o?.label ?? "?"}
                              </Badge>
                              <span className="text-muted-foreground">
                                {mine ? "You" : "Someone"} bought {t.shares}
                              </span>
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              → {formatProbability(t.probAfter)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Leaderboard eventSlug={eventSlug} />

              <p className="px-1 text-center text-xs text-muted-foreground">
                Open this page in another tab and trade — the price moves for
                everyone, live.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TopBar({
  eventSlug,
  isActive,
  balance,
}: {
  eventSlug: string;
  isActive: boolean;
  balance?: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back to home"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="text-sm font-semibold capitalize leading-tight">
              {eventSlug} event
            </div>
            <div className="text-xs text-muted-foreground">Sideline live market</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isActive ? "success" : "muted"}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                isActive ? "animate-pulse bg-success" : "bg-muted-foreground",
              )}
            />
            {isActive ? "Live" : "Connecting"}
          </Badge>
          {balance !== undefined && (
            <span className="hidden text-sm font-medium tabular-nums sm:inline">
              {formatPlayMoney(balance)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function OutcomeTile({
  label,
  prob,
  tone,
  disabled,
  loading,
  resolved,
  won,
  onBuy,
}: {
  label: string;
  prob: number;
  tone: "yes" | "no";
  disabled: boolean;
  loading: boolean;
  resolved: boolean;
  won: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      data-testid={`outcome-${label}`}
      className={cn(
        "rounded-xl border p-4 transition-opacity",
        won && "ring-2 ring-success",
        resolved && !won && "opacity-50",
        tone === "yes"
          ? "border-success/30 bg-success/5"
          : "border-destructive/25 bg-destructive/5",
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-medium">{label}</span>
        <span
          data-testid={`prob-${label}`}
          className={cn(
            "text-3xl font-semibold tabular-nums",
            tone === "yes" ? "text-success" : "text-destructive",
          )}
        >
          {formatProbability(prob)}
        </span>
      </div>
      {resolved ? (
        <div className="mt-4 flex h-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {won ? (
            <span className="text-success">Winner ✓</span>
          ) : (
            <span className="text-muted-foreground">Did not resolve</span>
          )}
        </div>
      ) : (
        <Button
          className="mt-4 w-full"
          data-testid={`buy-${label}`}
          variant={tone === "yes" ? "success" : "destructive"}
          disabled={disabled}
          onClick={onBuy}
        >
          {loading ? <Loader2 className="animate-spin" /> : `Buy ${label}`}
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <h1 className="text-xl font-semibold">No market here yet</h1>
        <p className="mt-2 text-muted-foreground">
          This event doesn&apos;t have any open markets. Check back soon.
        </p>
        <Link href="/e/demo">
          <Button className="mt-6">Go to the demo market</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
