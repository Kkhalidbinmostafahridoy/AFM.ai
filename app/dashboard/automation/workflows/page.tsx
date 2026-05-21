import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { WorkflowRunner } from "@/components/afm/workflow-runner";
import { AFM_WORKFLOWS } from "@/lib/afm/workflows";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkflowsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="AI Workflows"
      description="One-click automation — viral video, campaigns, auto content."
      maxWidth="max-w-3xl"
    >
      <WorkflowRunner defaultWorkflowId="viral-video" />
      <div className="grid gap-3 mt-8">
        {AFM_WORKFLOWS.map((w) => (
          <Card key={w.id} className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{w.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {w.description}
              <ul className="mt-2 list-disc list-inside">
                {w.steps.map((s) => (
                  <li key={s.id}>{s.label}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </AfmPageShell>
  );
}
