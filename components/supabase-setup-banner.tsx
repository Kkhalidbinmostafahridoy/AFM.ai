import { AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseConfigStatus } from "@/lib/supabase";
import Link from "next/link";

export function SupabaseSetupBanner() {
  const status = getSupabaseConfigStatus();

  if (status.configured) return null;

  const missing: string[] = [];
  if (!status.hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!status.hasAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!status.hasServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return (
    <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
      <CardContent className="flex gap-3 pt-6">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm space-y-3 flex-1">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Supabase is not configured
          </p>
          <p className="text-muted-foreground">
            Your <code className="text-xs bg-muted px-1 rounded">.env.local</code> still
            has placeholder values. Replace them with keys from your Supabase project.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Create a free project at{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-0.5"
              >
                supabase.com/dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <strong>Settings → API</strong> — copy Project URL, anon key, and
              service_role key
            </li>
            <li>
              Paste into <code className="text-xs bg-muted px-1 rounded">.env.local</code>{" "}
              (lines 14–16)
            </li>
            <li>
              Run <code className="text-xs bg-muted px-1 rounded">database/schema.sql</code>{" "}
              in Supabase SQL Editor
            </li>
            <li>Restart <code className="text-xs bg-muted px-1 rounded">npm run dev</code></li>
          </ol>
          {missing.length > 0 && (
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
              Still placeholder or missing: {missing.join(", ")}
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Supabase API settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
