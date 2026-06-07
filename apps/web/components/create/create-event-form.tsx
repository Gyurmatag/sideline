"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useReducer, useSpacetimeDB } from "spacetimedb/react";

import { reducers } from "@/src/module_bindings";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateEventForm() {
  const router = useRouter();
  const { isActive } = useSpacetimeDB();
  const createEvent = useReducer(reducers.createEvent);
  const createMarket = useReducer(reducers.createMarket);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("Sideline Bucks");
  const [accent, setAccent] = useState("#6366f1");
  const [question, setQuestion] = useState("Will the keynote run over time?");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = useMemo(() => slugify(name), [name]);
  const canSubmit = isActive && slug.length >= 2 && question.trim().length > 0 && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await createEvent({ slug, name: name.trim(), currencyName: currency, accent });
      await createMarket({ eventId: slug, question: question.trim(), b: 50 });
      router.push(`/e/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the event");
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create your event</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Spin up a white-labeled, real-time market in seconds. Share the link and
          attendees join instantly with play money — no signup.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Event name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FOMO Hackathon 2026"
              maxLength={60}
              required
            />
            {slug.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Link: <span className="font-mono text-foreground">/e/{slug}</span>
              </p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Play-money name</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="Sideline Bucks"
                maxLength={24}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  id="accent"
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-background"
                  aria-label="Accent color"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">First market question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will the keynote run over time?"
              maxLength={140}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" /> Creating…
              </>
            ) : !isActive ? (
              "Connecting…"
            ) : (
              <>
                Create &amp; open <ArrowRight />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Play money only. No cash-out, no KYC. Not gambling.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
