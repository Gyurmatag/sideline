import { SiteHeader } from "@/components/site/site-header";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <AuthForm mode="sign-in" />
      </main>
    </>
  );
}
