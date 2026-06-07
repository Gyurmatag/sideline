import { schema, table, t, SenderError } from "spacetimedb/server";
import { ScheduleAt } from "spacetimedb";
import { costToBuy, lmsrPrices } from "./lmsr";
import { resolvedPrices } from "./settlement";
import { isValidSlug } from "./validation";

// How often the housekeeping tick runs (keeps markets alive with no client).
const TICK_INTERVAL_MICROS = 20_000_000n; // 20s

// Scheduled table: each interval fires `tickMarkets`. Defined standalone so the
// reducer can reference `marketTicks.rowType`.
const marketTicks = table(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ref breaks the circular dep with the reducer
  { name: "market_ticks", scheduled: (): any => tickMarkets },
  {
    scheduled_id: t.u64().primaryKey().autoInc(),
    scheduled_at: t.scheduleAt(),
  },
);

const STARTING_BALANCE = 1000;
const DEMO_EVENT = "demo";
const DEMO_LIQUIDITY = 50;

const spacetimedb = schema({
  market_ticks: marketTicks,
  // Tenants/events. markets.event_id references events.slug. Anonymous organizers
  // for the MVP self-serve flow (production gates this to authed org admins).
  events: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      slug: t.string().unique(),
      name: t.string(),
      currency_name: t.string(),
      accent: t.string(), // branding accent color (hex)
      created_by: t.identity(),
      created_at: t.timestamp(),
    },
  ),
  users: table(
    { public: true },
    {
      identity: t.identity().primaryKey(),
      balance: t.f64(),
      created_at: t.timestamp(),
    },
  ),
  markets: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      event_id: t.string().index("btree"),
      question: t.string(),
      status: t.string(), // 'open' | 'closed' | 'resolved'
      b: t.f64(),
      created_at: t.timestamp(),
    },
  ),
  outcomes: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      market_id: t.u64().index("btree"),
      label: t.string(),
      q: t.f64(),
    },
  ),
  positions: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      // `${identityHex}:${outcomeId}` — gives us O(1) upsert without composite keys.
      key: t.string().unique(),
      owner: t.identity(),
      market_id: t.u64().index("btree"),
      outcome_id: t.u64(),
      shares: t.f64(),
    },
  ),
  trades: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      market_id: t.u64().index("btree"),
      outcome_id: t.u64(),
      trader: t.identity(),
      shares: t.f64(),
      cost: t.f64(),
      prob_after: t.f64(),
      ts: t.timestamp(),
    },
  ),
  market_price_history: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      market_id: t.u64().index("btree"),
      outcome_id: t.u64(),
      prob: t.f64(),
      ts: t.timestamp(),
    },
  ),
  // AI agents (liquidity makers + transparent forecasters). An agent is a
  // special user identified by its SpacetimeDB identity; it trades via
  // place_trade like anyone else and narrates via agent_feed.
  agents: table(
    { public: true },
    {
      identity: t.identity().primaryKey(),
      event_id: t.string().index("btree"),
      name: t.string(),
      persona: t.string(),
      role: t.string(), // 'maker' | 'forecaster'
      created_at: t.timestamp(),
    },
  ),
  // The transparent reasoning feed — the AI showcase. Forecaster agents post a
  // probability + reasoning here, then trade on it.
  agent_feed: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      event_id: t.string().index("btree"),
      market_id: t.u64().index("btree"),
      agent_identity: t.identity(),
      agent_name: t.string(),
      kind: t.string(), // 'forecast' | 'trade' | 'note'
      reasoning: t.string(),
      probability: t.f64(),
      ts: t.timestamp(),
    },
  ),
  // One row per resolved market (manual organizer result = source of truth).
  resolutions: table(
    { public: true },
    {
      id: t.u64().primaryKey().autoInc(),
      market_id: t.u64().unique(),
      winning_outcome_id: t.u64(),
      resolved_at: t.timestamp(),
    },
  ),
});

export default spacetimedb;

type Ctx = Parameters<Parameters<typeof spacetimedb.reducer>[1]>[0];

function ensureUser(ctx: Ctx) {
  const existing = ctx.db.users.identity.find(ctx.sender);
  if (existing) return existing;
  return ctx.db.users.insert({
    identity: ctx.sender,
    balance: STARTING_BALANCE,
    created_at: ctx.timestamp,
  });
}

/** Open a fresh binary (YES/NO) market in an event and seed its initial 50/50 price. */
function openBinaryMarket(ctx: Ctx, eventId: string, question: string, b: number) {
  const market = ctx.db.markets.insert({
    id: 0n,
    event_id: eventId,
    question,
    status: "open",
    b,
    created_at: ctx.timestamp,
  });
  ctx.db.outcomes.insert({ id: 0n, market_id: market.id, label: "YES", q: 0 });
  ctx.db.outcomes.insert({ id: 0n, market_id: market.id, label: "NO", q: 0 });
  for (const o of ctx.db.outcomes.market_id.filter(market.id)) {
    ctx.db.market_price_history.insert({
      id: 0n,
      market_id: market.id,
      outcome_id: o.id,
      prob: 0.5,
      ts: ctx.timestamp,
    });
  }
  return market;
}

function seedDemoIfEmpty(ctx: Ctx) {
  if (ctx.db.markets.count() > 0n) return;
  openBinaryMarket(
    ctx,
    DEMO_EVENT,
    "Will the live demo work on the first try?",
    DEMO_LIQUIDITY,
  );
}

/** Keep the always-on demo event alive: if every demo market is resolved, open a fresh one. */
function ensureDemoOpen(ctx: Ctx) {
  const hasOpen = Array.from(ctx.db.markets.event_id.filter(DEMO_EVENT)).some(
    (m) => m.status === "open",
  );
  if (hasOpen) return;
  openBinaryMarket(
    ctx,
    DEMO_EVENT,
    "Will the next live demo work on the first try?",
    DEMO_LIQUIDITY,
  );
}

function scheduleTicksIfNeeded(ctx: Ctx) {
  if (ctx.db.market_ticks.count() > 0n) return;
  ctx.db.market_ticks.insert({
    scheduled_id: 0n,
    scheduled_at: ScheduleAt.interval(TICK_INTERVAL_MICROS),
  });
}

export const init = spacetimedb.init((ctx) => {
  seedDemoIfEmpty(ctx);
  scheduleTicksIfNeeded(ctx);
});

/** Idempotently start the housekeeping tick (for DBs created before it existed). */
export const startTicks = spacetimedb.reducer((ctx) => {
  scheduleTicksIfNeeded(ctx);
});

export const onConnect = spacetimedb.clientConnected((ctx) => {
  ensureUser(ctx);
});

export const onDisconnect = spacetimedb.clientDisconnected((_ctx) => {
  // no-op for now
});

/** Re-seed the demo market (idempotent) — handy for fresh deploys. */
export const seedDemo = spacetimedb.reducer((ctx) => {
  seedDemoIfEmpty(ctx);
});

/**
 * The pricing engine. Runs transactionally: recompute the LMSR cost, debit the
 * trader, update outcome shares + position, append price history, record the
 * trade. The new price streams to every subscribed client.
 */
export const placeTrade = spacetimedb.reducer(
  { marketId: t.u64(), outcomeId: t.u64(), shares: t.f64() },
  (ctx, { marketId, outcomeId, shares }) => {
    if (!(shares > 0)) throw new SenderError("shares must be positive");

    const market = ctx.db.markets.id.find(marketId);
    if (!market) throw new SenderError("market not found");
    if (market.status !== "open") throw new SenderError("market is not open");

    const outs = Array.from(ctx.db.outcomes.market_id.filter(marketId)).sort(
      (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
    if (outs.length < 2) throw new SenderError("market has no outcomes");

    const idx = outs.findIndex((o) => o.id === outcomeId);
    if (idx < 0) throw new SenderError("outcome does not belong to this market");

    const q = outs.map((o) => o.q);
    const cost = costToBuy(q, idx, shares, market.b);

    const user = ensureUser(ctx);
    if (cost > user.balance) throw new SenderError("insufficient balance");

    // Apply share delta to the traded outcome.
    const target = outs[idx];
    ctx.db.outcomes.id.update({ ...target, q: target.q + shares });

    // Debit the trader.
    ctx.db.users.identity.update({ ...user, balance: user.balance - cost });

    // Upsert the position.
    const key = `${ctx.sender.toHexString()}:${outcomeId}`;
    const pos = ctx.db.positions.key.find(key);
    if (pos) {
      ctx.db.positions.id.update({ ...pos, shares: pos.shares + shares });
    } else {
      ctx.db.positions.insert({
        id: 0n,
        key,
        owner: ctx.sender,
        market_id: marketId,
        outcome_id: outcomeId,
        shares,
      });
    }

    // Recompute prices and snapshot history for every outcome.
    const q2 = q.slice();
    q2[idx] += shares;
    const prices = lmsrPrices(q2, market.b);
    for (let i = 0; i < outs.length; i++) {
      ctx.db.market_price_history.insert({
        id: 0n,
        market_id: marketId,
        outcome_id: outs[i].id,
        prob: prices[i],
        ts: ctx.timestamp,
      });
    }

    // Record the trade.
    ctx.db.trades.insert({
      id: 0n,
      market_id: marketId,
      outcome_id: outcomeId,
      trader: ctx.sender,
      shares,
      cost,
      prob_after: prices[idx],
      ts: ctx.timestamp,
    });
  },
);

/** Register (or update) the calling identity as an AI agent for an event. */
export const registerAgent = spacetimedb.reducer(
  {
    eventId: t.string(),
    name: t.string(),
    persona: t.string(),
    role: t.string(),
  },
  (ctx, { eventId, name, persona, role }) => {
    ensureUser(ctx); // agents trade like users, so they need a play balance
    const existing = ctx.db.agents.identity.find(ctx.sender);
    if (existing) {
      ctx.db.agents.identity.update({
        ...existing,
        event_id: eventId,
        name,
        persona,
        role,
      });
    } else {
      ctx.db.agents.insert({
        identity: ctx.sender,
        event_id: eventId,
        name,
        persona,
        role,
        created_at: ctx.timestamp,
      });
    }
  },
);

/** Post a transparent reasoning entry (forecast/trade/note) to the live feed. */
export const postAgentFeed = spacetimedb.reducer(
  {
    eventId: t.string(),
    marketId: t.u64(),
    kind: t.string(),
    reasoning: t.string(),
    probability: t.f64(),
  },
  (ctx, { eventId, marketId, kind, reasoning, probability }) => {
    const agent = ctx.db.agents.identity.find(ctx.sender);
    ctx.db.agent_feed.insert({
      id: 0n,
      event_id: eventId,
      market_id: marketId,
      agent_identity: ctx.sender,
      agent_name: agent ? agent.name : "agent",
      kind,
      reasoning,
      probability,
      ts: ctx.timestamp,
    });
  },
);

/**
 * Resolve a market to a winning outcome (organizer-entered result = source of
 * truth). Pays 1 play-money unit per winning share, settles all positions to
 * zero, marks the market resolved, and snapshots final prices. Idempotent: a
 * resolved market cannot be resolved again.
 *
 * NOTE: open to any caller for the demo. Production gates this to org admins.
 */
export const resolveMarket = spacetimedb.reducer(
  { marketId: t.u64(), winningOutcomeId: t.u64() },
  (ctx, { marketId, winningOutcomeId }) => {
    const market = ctx.db.markets.id.find(marketId);
    if (!market) throw new SenderError("market not found");
    if (market.status === "resolved") throw new SenderError("market already resolved");

    const outs = Array.from(ctx.db.outcomes.market_id.filter(marketId));
    if (!outs.some((o) => o.id === winningOutcomeId)) {
      throw new SenderError("winning outcome does not belong to this market");
    }

    for (const pos of ctx.db.positions.market_id.filter(marketId)) {
      if (pos.shares > 0 && pos.outcome_id === winningOutcomeId) {
        const u = ctx.db.users.identity.find(pos.owner);
        if (u) ctx.db.users.identity.update({ ...u, balance: u.balance + pos.shares });
      }
      if (pos.shares !== 0) ctx.db.positions.id.update({ ...pos, shares: 0 });
    }

    ctx.db.markets.id.update({ ...market, status: "resolved" });

    for (const { outcomeId, prob } of resolvedPrices(
      outs.map((o) => o.id),
      winningOutcomeId,
    )) {
      ctx.db.market_price_history.insert({
        id: 0n,
        market_id: marketId,
        outcome_id: outcomeId,
        prob,
        ts: ctx.timestamp,
      });
    }

    ctx.db.resolutions.insert({
      id: 0n,
      market_id: marketId,
      winning_outcome_id: winningOutcomeId,
      resolved_at: ctx.timestamp,
    });
  },
);

/** Ensure the demo event always has an open market (handy after resolution). */
export const reseedDemo = spacetimedb.reducer((ctx) => {
  ensureDemoOpen(ctx);
});

/** Self-serve: create a white-labeled event (tenant). Slug must be unique. */
export const createEvent = spacetimedb.reducer(
  {
    slug: t.string(),
    name: t.string(),
    currencyName: t.string(),
    accent: t.string(),
  },
  (ctx, { slug, name, currencyName, accent }) => {
    if (!isValidSlug(slug)) {
      throw new SenderError("invalid link (use lowercase letters, numbers, hyphens)");
    }
    if (ctx.db.events.slug.find(slug)) {
      throw new SenderError("that event link is already taken");
    }
    if (name.trim().length === 0) throw new SenderError("event name is required");
    ctx.db.events.insert({
      id: 0n,
      slug,
      name: name.trim(),
      currency_name: currencyName.trim() || "Sideline Bucks",
      accent: accent || "#6366f1",
      created_by: ctx.sender,
      created_at: ctx.timestamp,
    });
  },
);

/** Create a binary market inside an event. */
export const createMarket = spacetimedb.reducer(
  { eventId: t.string(), question: t.string(), b: t.f64() },
  (ctx, { eventId, question, b }) => {
    if (question.trim().length === 0) throw new SenderError("question is required");
    if (!(b > 0)) throw new SenderError("liquidity (b) must be positive");
    openBinaryMarket(ctx, eventId, question.trim(), b);
  },
);

/**
 * Housekeeping tick (scheduled, runs with NO client connected). Acts as a gentle
 * liquidity maker: for each open market it applies a small bounded nudge (kept
 * within [5%, 95%]) and snapshots prices, so the chart always has a live heartbeat
 * and no market ever looks dead. Deterministic via ctx.random.
 */
export const tickMarkets = spacetimedb.reducer(
  { timer: marketTicks.rowType },
  (ctx) => {
    // Self-heal: the public demo is always-on, so reopen it if it ever fully resolves.
    ensureDemoOpen(ctx);

    for (const market of ctx.db.markets.iter()) {
      if (market.status !== "open") continue;
      const outs = [...ctx.db.outcomes.market_id.filter(market.id)].sort((a, b) =>
        a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
      );
      if (outs.length < 2) continue;

      const idx = ctx.random.integerInRange(0, outs.length - 1);
      const dir = ctx.random() < 0.5 ? -1 : 1;
      const nudge = dir * ctx.random.integerInRange(1, 3);
      const candidate = outs.map((o, i) => (i === idx ? o.q + nudge : o.q));
      const candidatePrices = lmsrPrices(candidate, market.b);

      // Only apply the nudge if it keeps the traded outcome within sane bounds.
      const apply = candidatePrices[idx] >= 0.05 && candidatePrices[idx] <= 0.95;
      if (apply) {
        ctx.db.outcomes.id.update({ ...outs[idx], q: outs[idx].q + nudge });
      }
      const prices = apply
        ? candidatePrices
        : lmsrPrices(
            outs.map((o) => o.q),
            market.b,
          );
      for (let i = 0; i < outs.length; i++) {
        ctx.db.market_price_history.insert({
          id: 0n,
          market_id: market.id,
          outcome_id: outs[i].id,
          prob: prices[i],
          ts: ctx.timestamp,
        });
      }
    }
  },
);
