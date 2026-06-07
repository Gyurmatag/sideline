"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";

// Render the session-aware view client-only: better-auth's useSession isn't
// meant to run during server prerender.
const DashboardView = dynamic(
  () => import("@/components/dashboard/dashboard-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    ),
  }
);

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <DashboardView />
      </main>
    </>
  );
}
