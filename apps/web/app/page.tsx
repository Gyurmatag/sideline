export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]"
      />
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-indigo-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Play money only — not gambling
      </span>

      <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
        Sideline
      </h1>

      <p className="mt-6 max-w-2xl text-balance text-lg text-white/70 sm:text-xl">
        A live, real-time prediction market for your event. Attendees trade play
        money on what happens next — and prices move for everyone, instantly.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#"
          className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Create your event
        </a>
        <a
          href="#"
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
        >
          Book a demo
        </a>
      </div>

      <p className="mt-16 text-xs uppercase tracking-[0.2em] text-white/30">
        Powered by SpacetimeDB · Cloudflare · Claude
      </p>
    </main>
  );
}
