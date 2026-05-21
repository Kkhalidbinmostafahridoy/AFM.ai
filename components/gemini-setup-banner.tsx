import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isGeminiConfigured } from "@/lib/gemini/client";

/** Shown when GEMINI_API_KEY is missing from the server environment. */
export function GeminiSetupBanner() {
  if (isGeminiConfigured()) return null;

  return (
    <Card className="mb-6 border-violet-500/50 bg-violet-500/10">
      <CardContent className="flex gap-3 pt-6">
        <AlertTriangle className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
        <div className="text-sm space-y-3 flex-1">
          <p className="font-medium text-violet-900 dark:text-violet-100">
            Gemini API not configured
          </p>
          <p className="text-muted-foreground">
            ViralForge uses <strong>Google Gemini</strong> only. Add a key from Google AI
            Studio — not OpenAI, not OpenCode. Keys usually start with{" "}
            <code className="text-xs bg-muted px-1 rounded">AIza</code>.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Create a key at{" "}
              <Link
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google AI Studio
              </Link>
            </li>
            <li>
              In <code className="text-xs bg-muted px-1 rounded">.env.local</code> add:{" "}
              <code className="text-xs bg-muted px-1 rounded">GEMINI_API_KEY=your_key</code>
            </li>
            <li>
              Restart the dev server (<code className="text-xs bg-muted px-1 rounded">npm run dev</code>)
            </li>
          </ol>
          <Button variant="outline" size="sm" asChild>
            <Link
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              Get API key
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
