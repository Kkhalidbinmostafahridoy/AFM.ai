import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AfmModulePage } from "@/components/afm/module-page";
import { AFM_MODULES } from "@/lib/afm/modules";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const mod = AFM_MODULES.find((m) => m.id === "website")!;

export default async function WebsiteBuilderPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AfmModulePage module={mod}>
      <p className="text-sm text-muted-foreground mb-4">
        Adaptive Workspace switches to code editor, API generator, and deploy panel when you say &quot;Build website&quot;.
      </p>
      <Button variant="gradient" asChild>
        <Link href="/dashboard/workspace">Open Adaptive Workspace</Link>
      </Button>
    </AfmModulePage>
  );
}
