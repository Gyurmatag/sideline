import { betterAuth } from "better-auth";
import { D1Dialect } from "kysely-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

interface AuthEnv {
  AUTH_DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
}

/**
 * Per-request Better Auth instance. Cloudflare bindings (D1) are only available
 * inside a request, so we build the instance from the request-scoped env rather
 * than a module-level singleton.
 */
export function createAuth(env: AuthEnv) {
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.AUTH_DB }),
      type: "sqlite",
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
  });
}

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return createAuth(env as unknown as AuthEnv);
}
