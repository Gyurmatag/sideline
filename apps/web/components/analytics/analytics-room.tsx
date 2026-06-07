"use client";

import { SpacetimeProvider } from "@/components/spacetime-provider";
import { AnalyticsBoard } from "./analytics-board";

export function AnalyticsRoom({ eventSlug }: { eventSlug: string }) {
  return (
    <SpacetimeProvider>
      <AnalyticsBoard eventSlug={eventSlug} />
    </SpacetimeProvider>
  );
}
