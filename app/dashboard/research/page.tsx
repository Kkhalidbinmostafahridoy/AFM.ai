import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { AFM_MODULES } from "@/lib/afm/modules";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const mod = AFM_MODULES.find((m) => m.id === "research")!;

export default async function ResearchPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmModulePage module={mod}>
      <p className="text-sm text-muted-foreground mb-4">
        Use <strong>AI Swarm → Research mode</strong> today for trend and web-style synthesis.
      </p>
      <Button variant="gradient" asChild>
        <Link href="/dashboard/swarm">Open Research Swarm</Link>
      </Button>
    </AfmModulePage>
  );
}
