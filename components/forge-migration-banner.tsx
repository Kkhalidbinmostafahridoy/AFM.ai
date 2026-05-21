import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  isSupabaseConfigured,
  isSupabaseCreditsTableReady,
  isSupabaseForgeTablesReady,
} from "@/lib/supabase";

/** Shown when base schema exists but ViralForge migration was not applied. */
export async function ForgeMigrationBanner() {
  if (!isSupabaseConfigured()) return null;
  const baseReady = await isSupabaseCreditsTableReady();
  if (!baseReady) return null;
  const forgeReady = await isSupabaseForgeTablesReady();
  if (forgeReady) return null;

  return (
    <Card className="mb-6 border-sky-500/40 bg-sky-500/10">
      <CardContent className="flex gap-3 pt-6">
        <AlertTriangle className="h-5 w-5 text-sky-700 dark:text-sky-300 shrink-0 mt-0.5" />
        <div className="text-sm space-y-2 flex-1">
          <p className="font-medium text-sky-900 dark:text-sky-100">
            ViralForge tables missing
          </p>
          <p className="text-muted-foreground">
            Run{" "}
            <code className="text-xs bg-muted px-1 rounded">
              database/migrations/002_viralforge.sql
            </code>{" "}
            and{" "}
            <code className="text-xs bg-muted px-1 rounded">
              003_translations_projects.sql
            </code>{" "}
            in the Supabase SQL Editor for images, shot plans, analysis, and translations.
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
