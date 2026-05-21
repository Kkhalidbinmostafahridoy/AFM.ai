import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, isSupabaseCreditsTableReady } from "@/lib/supabase";
import Link from "next/link";

/** Shown when env keys are set but `database/schema.sql` was not applied in Supabase. */
export async function SupabaseSchemaBanner() {
  if (!isSupabaseConfigured()) return null;
  const ready = await isSupabaseCreditsTableReady();
  if (ready) return null;

  return (
    <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
      <CardContent className="flex gap-3 pt-6">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm space-y-3 flex-1">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Database tables missing
          </p>
          <p className="text-muted-foreground">
            Supabase is connected, but the app tables are not in your project yet. Run the
            schema script once in the Supabase SQL Editor, then try generating again.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Open your project in Supabase → <strong>SQL Editor</strong></li>
            <li>
              Paste the full contents of{" "}
              <code className="text-xs bg-muted px-1 rounded">database/schema.sql</code> from
              this repo
            </li>
            <li>Click <strong>Run</strong>, then refresh this app</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            After the base schema, run{" "}
            <code className="bg-muted px-1 rounded">database/migrations/002_viralforge.sql</code>{" "}
            once to enable ViralForge images, shot plans, and video analysis tables.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link
              href="https://supabase.com/dashboard/project/_/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Open SQL Editor
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
