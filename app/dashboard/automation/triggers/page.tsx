import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function TriggersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title="Trigger Engine" description="Webhooks, schedules, and events (Phase 2).">
      <Card className="glass-card">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Examples: new YouTube upload → analyze → script; Shopify order → ad copy.
        </CardContent>
      </Card>
    </AfmPageShell>
  );
}
