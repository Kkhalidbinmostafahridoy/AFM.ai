"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Loader2,
  MessageSquare,
  Search,
  Share2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { AgentDefinition } from "@/lib/agents/definitions";
import type { AgentTask } from "@/lib/agents/task-store";

const ICONS: Record<string, React.ReactNode> = {
  bell: <Bell className="h-4 w-4 text-violet-500" />,
  share: <Share2 className="h-4 w-4 text-violet-500" />,
  message: <MessageSquare className="h-4 w-4 text-violet-500" />,
  sparkles: <Sparkles className="h-4 w-4 text-violet-500" />,
  search: <Search className="h-4 w-4 text-violet-500" />,
};

export function AgentsDashboard() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selected, setSelected] = useState<string>("social");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [alarmAt, setAlarmAt] = useState("");
  const [alarmLabel, setAlarmLabel] = useState("Reminder");

  const refresh = useCallback(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d: { agents?: AgentDefinition[]; tasks?: AgentTask[] }) => {
        if (d.agents) setAgents(d.agents);
        if (d.tasks) setTasks(d.tasks);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAgent = async (action: string, input: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: selected, action, input }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Agent failed",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      if (selected === "alarm" && data.task?.output?.browserNotification) {
        if ("Notification" in window && Notification.permission !== "granted") {
          await Notification.requestPermission();
        }
        const at = new Date(String(input.at)).getTime();
        const delay = Math.max(0, at - Date.now());
        const label = String(input.label ?? "Reminder");
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification("AFM.ai Alarm", { body: label });
          }
        }, delay);
      }
      toast({ title: "Agent completed", description: `Task ${data.task?.id}` });
      refresh();
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const agent = agents.find((a) => a.id === selected);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-2">
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a.id)}
            className={`w-full text-left rounded-xl border p-3 transition-colors ${
              selected === a.id
                ? "border-violet-500/50 bg-violet-500/10"
                : "hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              {ICONS[a.icon] ?? <Sparkles className="h-4 w-4" />}
              {a.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {a.description}
            </p>
          </button>
        ))}
      </div>

      <div className="lg:col-span-2 space-y-4">
        {agent && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                {agent.capabilities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>

              {selected === "alarm" && (
                <div className="space-y-3">
                  <div>
                    <Label>Reminder label</Label>
                    <Input
                      value={alarmLabel}
                      onChange={(e) => setAlarmLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Date & time</Label>
                    <Input
                      type="datetime-local"
                      value={alarmAt}
                      onChange={(e) => setAlarmAt(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="gradient"
                    disabled={loading || !alarmAt}
                    onClick={() =>
                      runAgent("create", {
                        label: alarmLabel,
                        at: new Date(alarmAt).toISOString(),
                      })
                    }
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Set alarm & browser notification
                  </Button>
                </div>
              )}

              {(selected === "social" ||
                selected === "auto-comment" ||
                selected === "content" ||
                selected === "research") && (
                <div className="space-y-3">
                  <div>
                    <Label>
                      {selected === "research" ? "Research query" : "Topic / prompt"}
                    </Label>
                    <Textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={3}
                      placeholder={
                        selected === "social"
                          ? "Product launch for AFM.ai..."
                          : "AI automation trends 2026..."
                      }
                    />
                  </div>
                  {selected === "social" && (
                    <div className="flex gap-2 flex-wrap">
                      {(["twitter", "facebook", "linkedin"] as const).map((p) => (
                        <Button
                          key={p}
                          variant="outline"
                          size="sm"
                          disabled={loading || !topic.trim()}
                          onClick={() =>
                            runAgent("generate", {
                              platform: p,
                              topic,
                              autoPublish: false,
                            })
                          }
                        >
                          Generate {p}
                        </Button>
                      ))}
                      <Button
                        variant="gradient"
                        size="sm"
                        disabled={loading || !topic.trim()}
                        onClick={() =>
                          runAgent("generate", {
                            platform: "twitter",
                            topic,
                            autoPublish: true,
                          })
                        }
                      >
                        Post to X (auto)
                      </Button>
                    </div>
                  )}
                  {selected !== "social" && (
                    <Button
                      variant="gradient"
                      disabled={loading || !topic.trim()}
                      onClick={() =>
                        runAgent("run", {
                          topic,
                          query: topic,
                          niche: topic,
                          monitorQuery: topic,
                          autoReply: selected === "auto-comment",
                        })
                      }
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Run agent
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Recent executions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {!tasks.length && (
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            )}
            {tasks.map((t) => (
              <div key={t.id} className="rounded-lg border px-3 py-2 text-xs">
                <p className="font-medium">
                  {t.agentId} · {t.status}
                </p>
                <p className="text-muted-foreground truncate">
                  {t.output
                    ? JSON.stringify(t.output).slice(0, 120)
                    : t.error ?? t.action}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
