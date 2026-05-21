import type { ReactNode } from "react";
import { AfmPageShell } from "@/components/afm/afm-page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AfmModule } from "@/lib/afm/modules";
import { PipelineDiagram } from "@/components/afm/pipeline-diagram";
import { Check, Clock } from "lucide-react";

export function AfmModulePage({
  module: mod,
  children,
}: {
  module: AfmModule;
  children?: ReactNode;
}) {
  return (
    <AfmPageShell title={mod.label} description={mod.description} maxWidth="max-w-5xl">
      {children ?? (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                mod.live
                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
              }`}
            >
              {mod.live ? (
                <>
                  <Check className="inline h-3 w-3 mr-1" />
                  Phase {mod.phase} · Live
                </>
              ) : (
                <>
                  <Clock className="inline h-3 w-3 mr-1" />
                  Phase {mod.phase} · Coming soon
                </>
              )}
            </span>
          </div>

          <PipelineDiagram />

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Planned features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {mod.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {!mod.live && (
            <div className="flex flex-wrap gap-2">
              <Button variant="gradient" asChild>
                <Link href="/dashboard/swarm">Try AI Swarm</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </AfmPageShell>
  );
}
