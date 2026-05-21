import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function ScheduledPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title="Scheduled AI" description="Run workflows at set times (Phase 2).">
      <Card className="glass-card">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Example: Post to TikTok and Facebook at 7 PM — requires AI Connect integrations.
        </CardContent>
      </Card>
    </AfmPageShell>
  );
}
