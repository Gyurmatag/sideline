import Link from "next/link";

import { SiteHeader } from "@/components/site/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className={cn(buttonVariants())}>
            Back home
          </Link>
          <Link
            href="/e/demo"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Try the demo
          </Link>
        </div>
      </main>
    </>
  );
}
