import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { WorkspaceClient } from "@/components/afm/workspace-client";

export default async function WorkspacePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="Adaptive Workspace"
      description="Dashboard layout adapts to your task — code, video, marketing, or design."
    >
      <WorkspaceClient />
    </AfmPageShell>
  );
}
