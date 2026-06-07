import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 text-sm font-bold text-white shadow-sm">
            S
          </span>
          Sideline
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="#product" className="transition-colors hover:text-foreground">
            Product
          </Link>
          <Link href="#organizers" className="transition-colors hover:text-foreground">
            For organizers
          </Link>
          <Link href="#how" className="transition-colors hover:text-foreground">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/e/demo"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Try the demo
          </Link>
          <Link href="/create" className={cn(buttonVariants({ size: "sm" }))}>
            Create your event
          </Link>
        </div>
      </div>
    </header>
  );
}
