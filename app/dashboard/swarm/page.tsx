import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { SwarmChat } from "@/components/afm/swarm-chat";
import { PipelineDiagram } from "@/components/afm/pipeline-diagram";

export default async function SwarmPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell
      title="AI Swarm"
      description="Single, Swarm, Auto, Debate, and Research modes — multi-model orchestration with live agent status."
      maxWidth="max-w-5xl"
    >
      <PipelineDiagram />
      <div className="mt-6">
        <SwarmChat />
      </div>
    </AfmPageShell>
  );
}
