"use client";

import { SpacetimeProvider } from "@/components/spacetime-provider";
import { CreateEventForm } from "./create-event-form";

export function CreateEvent() {
  return (
    <SpacetimeProvider>
      <CreateEventForm />
    </SpacetimeProvider>
  );
}
