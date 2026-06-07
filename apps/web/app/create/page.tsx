import { SiteHeader } from "@/components/site/site-header";
import { CreateEvent } from "@/components/create/create-event";

export default function CreatePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-6 py-16">
        <CreateEvent />
      </main>
    </>
  );
}
