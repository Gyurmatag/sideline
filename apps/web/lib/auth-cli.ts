// Static Better Auth config used ONLY by the Better Auth CLI to generate the
// D1 schema (`npx @better-auth/cli generate --config lib/auth-cli.ts`).
// It mirrors the runtime options in lib/auth.ts (email+password) but runs against
// an in-memory SQLite DB, since the CLI introspects a real connection and has no
// Cloudflare runtime binding. better-sqlite3 is a devDependency (never deployed).
import { betterAuth } from "better-auth";
import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
  database: {
    db: new Kysely({
      dialect: new SqliteDialect({ database: new Database(":memory:") }),
    }),
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
  },
});
