import { MarketRoom } from "@/components/market/market-room";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MarketRoom eventSlug={slug} />;
}
