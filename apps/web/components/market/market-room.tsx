"use client";

import { useMemo } from "react";
import { SpacetimeDBProvider } from "spacetimedb/react";

import { DbConnection } from "@/src/module_bindings";
import { SPACETIME_DB, SPACETIME_URI, STDB_TOKEN_KEY } from "@/lib/spacetime";
import { MarketBoard } from "./market-board";

export function MarketRoom({ eventSlug }: { eventSlug: string }) {
  const connectionBuilder = useMemo(() => {
    const savedToken =
      typeof window !== "undefined"
        ? localStorage.getItem(STDB_TOKEN_KEY) ?? undefined
        : undefined;

    return DbConnection.builder()
      .withUri(SPACETIME_URI)
      .withDatabaseName(SPACETIME_DB)
      .withToken(savedToken)
      .onConnect((_conn, _identity, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(STDB_TOKEN_KEY, token);
        }
      })
      .onConnectError((_ctx, error) => {
        // Surfaced in the UI via connection state; log for debugging.
        console.error("SpacetimeDB connection error:", error);
      });
  }, []);

  return (
    <SpacetimeDBProvider connectionBuilder={connectionBuilder}>
      <MarketBoard eventSlug={eventSlug} />
    </SpacetimeDBProvider>
  );
}
