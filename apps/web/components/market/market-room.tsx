"use client";

import { SpacetimeProvider } from "@/components/spacetime-provider";
import { MarketBoard } from "./market-board";

export function MarketRoom({ eventSlug }: { eventSlug: string }) {
  return (
    <SpacetimeProvider>
      <MarketBoard eventSlug={eventSlug} />
    </SpacetimeProvider>
  );
}
