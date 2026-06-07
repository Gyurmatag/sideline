import type { Metadata } from "next";

import { SiteHeader } from "@/components/site/site-header";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <AuthForm mode="sign-up" />
      </main>
    </>
  );
}
