/**
 * Minimal SpacetimeDB HTTP client. Lets a Cloudflare Worker read state (SQL) and
 * call reducers without a persistent WebSocket — so the forecaster can run on a
 * cron trigger in workerd. Auth is the agent's identity token (Bearer).
 */
export interface StdbConfig {
  host: string;
  db: string;
  token: string;
}

async function post(
  cfg: StdbConfig,
  path: string,
  body: string,
  contentType: string,
): Promise<Response> {
  const res = await fetch(`${cfg.host}/v1/database/${cfg.db}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": contentType,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`STDB ${path} -> ${res.status}: ${await res.text()}`);
  }
  return res;
}

export interface SqlStatement {
  schema: { elements: { name: { some?: string } }[] };
  rows: unknown[][];
}

export async function stdbSql(cfg: StdbConfig, query: string): Promise<SqlStatement[]> {
  const res = await post(cfg, "/sql", query, "text/plain");
  return (await res.json()) as SqlStatement[];
}

/** Call a reducer with positional args (JSON array), matching the CLI semantics. */
export async function stdbCall(
  cfg: StdbConfig,
  reducer: string,
  args: unknown[],
): Promise<void> {
  await post(cfg, `/call/${reducer}`, JSON.stringify(args), "application/json");
}

/** Map a SQL statement result (schema + positional rows) into keyed objects. */
export function rowsToObjects(stmt: SqlStatement): Record<string, unknown>[] {
  const names = stmt.schema.elements.map((e, i) => e.name.some ?? `col${i}`);
  return stmt.rows.map((row) =>
    Object.fromEntries(names.map((n, i) => [n, row[i]])),
  );
}
