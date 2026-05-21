"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AFM_WORKFLOWS } from "@/lib/afm/workflows";
import { LiveThinkingPanel } from "./live-thinking";
import type { ThinkingStep } from "@/lib/afm/types";
import { Loader2, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export function WorkflowRunner({ defaultWorkflowId }: { defaultWorkflowId?: string }) {
  const [workflowId, setWorkflowId] = useState(
    defaultWorkflowId ?? AFM_WORKFLOWS[0].id
  );
  const [topic, setTopic] = useState("");
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const workflow = AFM_WORKFLOWS.find((w) => w.id === workflowId);

  const run = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setResult(null);

    const wf = AFM_WORKFLOWS.find((w) => w.id === workflowId);
    if (!wf) return;

    setSteps(
      wf.steps.map((s, i) => ({
        id: s.id,
        label: s.label,
        status: i === 0 ? "active" : "pending",
      }))
    );

    for (let i = 0; i < wf.steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setSteps((prev) =>
        prev.map((s, j) => ({
          ...s,
          status:
            j < i ? "done" : j === i ? "active" : j === i + 1 ? "pending" : s.status,
        }))
      );
    }

    try {
      const res = await fetch("/api/afm/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, topic: topic.trim(), platform: "tiktok" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error, variant: "destructive" });
        setSteps([]);
        return;
      }
      setSteps((s) => s.map((x) => ({ ...x, status: "done" as const })));
      setResult(data.swarmSummary ?? `Workflow "${data.workflowName}" planned. Use Forge tools to render media.`);
    } catch {
      toast({ title: "Workflow failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Run workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="w-full h-10 rounded-md border bg-background px-3 text-sm"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
          >
            {AFM_WORKFLOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="Topic e.g. 1 AI replaces 10 apps"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button variant="gradient" onClick={run} disabled={loading || !topic.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start {workflow?.name}
          </Button>
        </CardContent>
      </Card>

      {steps.length > 0 && <LiveThinkingPanel steps={steps} />}

      {result && (
        <Card className="glass-card">
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-wrap">{result}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/forge/video">Video plan</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/generate">Scripts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
