import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Megaphone,
  Radio,
  Trophy,
} from "lucide-react";

import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Radio,
    title: "Real-time markets",
    body: "Attendees trade on what happens next. An LMSR market maker prices every bet, and the new odds stream to every screen instantly.",
  },
  {
    icon: Bot,
    title: "AI keeps it alive",
    body: "Liquidity and forecaster agents trade and post transparent reasoning, so no market is ever dead — and the AI is the show.",
  },
  {
    icon: Trophy,
    title: "Big-screen leaderboard",
    body: "A projector-ready spectator view with the live leaderboard and biggest moves turns your venue into a trading floor.",
  },
  {
    icon: Megaphone,
    title: "Sponsorable markets",
    body: "Sponsors can back branded markets — new inventory plus a real-time signal of attendee engagement.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your event",
    body: "Spin up a white-labeled event in minutes — your logo, colors, and play-money currency.",
  },
  {
    n: "02",
    title: "Attendees join",
    body: "Share a link or QR code. Everyone gets an instant play-money balance — no signup, no KYC.",
  },
  {
    n: "03",
    title: "The room comes alive",
    body: "Markets move in real time on every phone and the big screen. Resolve outcomes, pay out, crown a winner.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-48 -z-10 mx-auto h-[560px] max-w-5xl rounded-full bg-gradient-to-tr from-indigo-300/40 via-violet-300/30 to-rose-300/30 blur-3xl"
          />
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              <span className="size-1.5 rounded-full bg-success" />
              Play money only. No cash-out. Not gambling.
            </Badge>

            <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
              Turn your event into a live market.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
              Sideline is a white-label, real-time prediction market for events
              and hackathons. Attendees trade play money on what happens next —
              and prices move for everyone, instantly.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/create" className={cn(buttonVariants({ size: "lg" }))}>
                Create your event
                <ArrowRight />
              </Link>
              <Link
                href="/e/demo"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Open the live demo
              </Link>
            </div>
          </div>

          {/* Product preview */}
          <div id="product" className="mx-auto mt-16 max-w-4xl scroll-mt-24">
            <MarketPreview />
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/60 bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Engagement that runs itself.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything an organizer needs to make the room lean in — and a
                showcase the whole event can watch.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <Card key={f.title} className="h-full">
                  <CardContent className="p-6">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n}>
                  <div className="font-mono text-sm text-muted-foreground">{s.n}</div>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA for organizers */}
        <section
          id="organizers"
          className="scroll-mt-20 px-6 pb-28"
        >
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border bg-foreground px-8 py-16 text-center text-background sm:px-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-0 opacity-30 [background:radial-gradient(60%_120%_at_50%_0%,rgba(129,140,248,0.6),transparent_70%)]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Bring your next event to life.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-background/70">
                Hackathons, conferences, meetups — give your attendees a reason
                to lean in, and your sponsors a brand-new stage.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/create"
                  className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
                >
                  Create your event
                </Link>
                <Link
                  href="/e/demo"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    "text-background hover:bg-background/10 hover:text-background",
                  )}
                >
                  See the live demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Sideline. Play money only — not gambling.</p>
          <p className="text-xs uppercase tracking-[0.2em]">
            SpacetimeDB · Cloudflare · Claude
          </p>
        </div>
      </footer>
    </>
  );
}

function MarketPreview() {
  const yes = 0.62;
  return (
    <Card className="overflow-hidden shadow-xl shadow-black/5">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
          <span className="text-muted-foreground">FOMO Hackathon · Demo</span>
        </div>
        <Badge variant="muted">LMSR market maker</Badge>
      </div>

      <CardContent className="p-6">
        <p className="text-lg font-semibold">
          Will the live demo work on the first try?
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PriceTile label="YES" prob={yes} tone="success" />
          <PriceTile label="NO" prob={1 - yes} tone="muted" />
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${yes * 100}%` }}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="size-4" />
            Prices update live for every connected screen
          </div>
          <Link href="/e/demo" className={cn(buttonVariants({ size: "sm" }))}>
            Open live demo
            <ArrowRight />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceTile({
  label,
  prob,
  tone,
}: {
  label: string;
  prob: number;
  tone: "success" | "muted";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3.5">
      <span className="font-medium">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums",
          tone === "success" ? "text-success" : "text-muted-foreground",
        )}
      >
        {Math.round(prob * 100)}%
      </span>
    </div>
  );
}
