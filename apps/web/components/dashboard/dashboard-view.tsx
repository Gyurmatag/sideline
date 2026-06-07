"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DashboardView() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace("/sign-in");
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Organizer dashboard
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name || session.user.email}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {session.user.email}. Spin up a white-labeled event and share
          the link with your attendees.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/create" className={cn(buttonVariants({ size: "lg" }))}>
            Create an event <ArrowRight />
          </Link>
          <Link
            href="/e/demo"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Open the demo
          </Link>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6">
          <Button
            variant="ghost"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
