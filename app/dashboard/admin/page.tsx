import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsDashboard } from "@/components/analytics/dashboard";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="Admin Panel"
      description="Enterprise telemetry, quotas, and global user intelligence."
      maxWidth="max-w-6xl"
    >
      <div className="mb-6 flex gap-3">
        <Button asChild variant="default" size="sm">
          <Link href="/dashboard/analytics">Open full analytics</Link>
        </Button>
      </div>
      <AnalyticsDashboard />
      <Card className="glass-card mt-8">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          RBAC, moderation, and enterprise API keys ship in Phase 4. Analytics data
          is GDPR-safe: no prompts stored, rate-limited ingestion, encrypted at rest
          when ANALYTICS_ENCRYPTION_KEY is set.
        </CardContent>
      </Card>
    </AfmPageShell>
  );
}
