import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { AnalyticsDashboard } from "@/components/analytics/dashboard";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="Enterprise Analytics"
      description="Real-time user intelligence, AI orchestration metrics, media pipeline analytics, and productivity scoring."
      maxWidth="max-w-6xl"
    >
      <AnalyticsDashboard />
    </AfmPageShell>
  );
}
