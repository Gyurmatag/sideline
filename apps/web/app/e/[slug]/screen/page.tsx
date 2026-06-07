import { ScreenRoom } from "@/components/screen/screen-room";

export default async function ScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ScreenRoom eventSlug={slug} />;
}
