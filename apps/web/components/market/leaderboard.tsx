"use client";

import { Bot, Crown } from "lucide-react";
import { useSpacetimeDB, useTable } from "spacetimedb/react";

import { tables } from "@/src/module_bindings";
import { pricesFromQ } from "@/lib/spacetime";
import { formatPlayMoney, initials } from "@/lib/format";
import { netWorths } from "@/lib/leaderboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Live leaderboard. Net worth = play-money balance + mark-to-market value of
 * every open position (shares x current LMSR price). Computed client-side so it
 * updates instantly as trades land — no extra server state needed.
 */
export function Leaderboard({ eventSlug }: { eventSlug: string }) {
  const { identity } = useSpacetimeDB();
  const [markets] = useTable(tables.markets.where((r) => r.eventId.eq(eventSlug)));
  const [outcomes] = useTable(tables.outcomes);
  const [positions] = useTable(tables.positions);
  const [users] = useTable(tables.users);
  const [agents] = useTable(tables.agents.where((r) => r.eventId.eq(eventSlug)));

  const priceByOutcome = new Map<string, number>();
  for (const m of markets) {
    const outs = outcomes
      .filter((o) => o.marketId === m.id)
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const prices = pricesFromQ(
      outs.map((o) => o.q),
      m.b,
    );
    outs.forEach((o, i) => priceByOutcome.set(o.id.toString(), prices[i] ?? 0));
  }

  const agentName = new Map(agents.map((a) => [a.identity.toHexString(), a.name]));

  const myHex = identity?.toHexString();
  const rows = netWorths(
    users.map((u) => {
      const hex = u.identity.toHexString();
      const name = agentName.get(hex);
      return {
        hex,
        balance: u.balance,
        name: name ?? `Trader ${hex.slice(0, 4)}`,
        isAgent: name !== undefined,
        isMe: hex === myHex,
      };
    }),
    positions.map((p) => ({
      ownerHex: p.owner.toHexString(),
      outcomeId: p.outcomeId.toString(),
      shares: p.shares,
    })),
    priceByOutcome,
  ).slice(0, 8);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Crown className="size-4 text-amber-500" />
          Leaderboard
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No traders yet.</p>
        ) : (
          <ol className="space-y-2.5">
            {rows.map((r, i) => (
              <li
                key={r.hex}
                data-testid="leaderboard-row"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm",
                  r.isMe && "bg-primary/5",
                )}
              >
                <span className="w-4 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                    r.isAgent
                      ? "bg-gradient-to-br from-indigo-500 to-violet-500"
                      : "bg-gradient-to-br from-slate-500 to-slate-700",
                  )}
                >
                  {initials(r.name)}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate font-medium">
                  {r.name}
                  {r.isAgent && <Bot className="size-3 text-indigo-500" />}
                  {r.isMe && (
                    <Badge variant="secondary" className="px-1.5 py-0">
                      you
                    </Badge>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPlayMoney(r.net, "")}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
