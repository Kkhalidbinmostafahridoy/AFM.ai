import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { WorkflowRunner } from "@/components/afm/workflow-runner";

export default async function AutoContentPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title="Auto Content" description="Batch scripts and assets from one topic." maxWidth="max-w-3xl">
      <WorkflowRunner defaultWorkflowId="auto-content" />
    </AfmPageShell>
  );
}
