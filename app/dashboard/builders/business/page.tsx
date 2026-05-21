import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { AFM_MODULES } from "@/lib/afm/modules";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const mod = AFM_MODULES.find((m) => m.id === "business")!;

export default async function BusinessBuilderPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmModulePage module={mod}>
      <Button variant="gradient" asChild>
        <Link href="/dashboard/automation/workflows">Run marketing campaign workflow</Link>
      </Button>
    </AfmModulePage>
  );
}
