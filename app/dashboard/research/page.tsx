import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { Button } from "@/components/ui/button";
import { AFM_MODULES } from "@/lib/afm/modules";

const mod = AFM_MODULES.find((m) => m.id === "research")!;

export default async function ResearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmPageShell title={mod.label} description={mod.description}>
      <p className="text-sm text-muted-foreground mb-4">
        Research mode uses multi-model synthesis with citations-style output. Use AI Chat
        Research mode or AI Swarm for deep dives.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="gradient" asChild>
          <Link href="/dashboard/chat">AI Chat — Research mode</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/swarm">AI Swarm — Research</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/agents">Research Agent</Link>
        </Button>
      </div>
    </AfmPageShell>
  );
}
