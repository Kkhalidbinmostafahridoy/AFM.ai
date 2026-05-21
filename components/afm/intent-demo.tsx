"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { IntentAnalysis } from "@/lib/afm/types";
import { Loader2 } from "lucide-react";

export function IntentDemo() {
  const [message, setMessage] = useState(
    "Create tourism marketing campaign for Bangladesh"
  );
  const [result, setResult] = useState<IntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/afm/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
      <Button variant="gradient" onClick={analyze} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Analyze intent
      </Button>
      {result && (
        <Card className="glass-card">
          <CardContent className="pt-4 space-y-3 text-sm">
            <p>
              <strong>Intent:</strong> {result.intent}
            </p>
            <p>
              <strong>Workspace:</strong> {result.workspaceMode}
            </p>
            <p>
              <strong>Task:</strong> {result.taskCategory}
            </p>
            {result.suggestedWorkflow && (
              <p>
                <strong>Workflow:</strong> {result.suggestedWorkflow}
              </p>
            )}
            {result.subtasks.length > 0 && (
              <table className="w-full text-xs border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Task</th>
                    <th className="text-left p-2">AI</th>
                    <th className="text-left p-2">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subtasks.map((s) => (
                    <tr key={s.task} className="border-t">
                      <td className="p-2">{s.task}</td>
                      <td className="p-2">{s.displayName}</td>
                      <td className="p-2 text-muted-foreground">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
