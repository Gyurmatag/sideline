"use client";

import { SpacetimeProvider } from "@/components/spacetime-provider";
import { ScreenBoard } from "./screen-board";

export function ScreenRoom({ eventSlug }: { eventSlug: string }) {
  return (
    <SpacetimeProvider>
      <ScreenBoard eventSlug={eventSlug} />
    </SpacetimeProvider>
  );
}
