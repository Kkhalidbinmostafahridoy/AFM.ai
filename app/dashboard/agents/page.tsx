import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { AgentsDashboard } from "@/components/afm/agents-dashboard";
import { AFM_MODULES } from "@/lib/afm/modules";

const mod = AFM_MODULES.find((m) => m.id === "agents")!;

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title={mod.label} description={mod.description} maxWidth="max-w-6xl">
      <AgentsDashboard />
    </AfmPageShell>
  );
}
