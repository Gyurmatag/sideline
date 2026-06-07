import { AnalyticsRoom } from "@/components/analytics/analytics-room";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AnalyticsRoom eventSlug={slug} />;
}
