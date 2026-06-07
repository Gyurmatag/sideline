import { schema, table, t, SenderError } from "spacetimedb/server";
import { costToBuy, lmsrPrices } from "./lmsr";

const STARTING_BALANCE = 1000;
const DEMO_EVENT = "demo";
const DEMO_LIQUIDITY = 50;

const spacetimedb = schema({
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

function seedDemoIfEmpty(ctx: Ctx) {
  if (ctx.db.markets.count() > 0n) return;
  const market = ctx.db.markets.insert({
    id: 0n,
    event_id: DEMO_EVENT,
    question: "Will the live demo work on the first try?",
    status: "open",
    b: DEMO_LIQUIDITY,
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
}

export const init = spacetimedb.init((ctx) => {
  seedDemoIfEmpty(ctx);
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
