"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#organizers", label: "For organizers" },
  { href: "/#how", label: "How it works" },
];

export function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = authClient.useSession();

  // Render the signed-out state on the server / first paint, then reconcile on
  // the client to avoid a hydration mismatch (the server can't know the session).
  useEffect(() => setMounted(true), []);
  const authed = mounted && !!session;

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Left: logo + primary nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
            onClick={() => setOpen(false)}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 text-sm font-bold text-white shadow-sm">
              S
            </span>
            Sideline
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: actions (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Sign in
            </Link>
          )}
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }))}>
            Create your event
          </Link>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile: dropdown panel */}
      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {authed ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <Button variant="outline" className="w-full" onClick={signOut}>
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/create"
                onClick={() => setOpen(false)}
                className={cn(buttonVariants(), "w-full")}
              >
                Create your event
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
