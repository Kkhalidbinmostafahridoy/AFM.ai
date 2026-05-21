"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdaptiveWorkspace } from "./adaptive-workspace";
import { IntentDemo } from "./intent-demo";
import type { WorkspaceMode } from "@/lib/afm/types";
import { Loader2 } from "lucide-react";

export function WorkspaceClient() {
  const [mode, setMode] = useState<WorkspaceMode>("general");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const detect = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/afm/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      setMode(data.workspaceMode ?? "general");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Textarea
          placeholder='Try "Build website" or "Create movie"…'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
        />
        <Button variant="gradient" onClick={detect} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Transform workspace
        </Button>
      </div>
      <AdaptiveWorkspace mode={mode} />
      <IntentDemo />
    </div>
  );
}
