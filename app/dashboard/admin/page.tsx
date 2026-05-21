import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="Admin Panel"
      description="Usage analytics, user management, API quotas — Phase 4."
    >
      <Card className="glass-card">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Admin tools will include global analytics, moderation, and enterprise API keys.
          Restricted to admin roles when RBAC is enabled.
        </CardContent>
      </Card>
    </AfmPageShell>
  );
}
