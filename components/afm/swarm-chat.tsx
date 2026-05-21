"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Send,
  Trash2,
  Users,
  Swords,
  Search,
  Sparkles,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import type { ChatTurn } from "@/types/chat";
import type { SwarmAgentStatus, SwarmMode } from "@/lib/afm/types";
import { cn } from "@/lib/utils";
import { AFM_AI_NAME } from "@/lib/constants";
import { LiveThinkingPanel } from "./live-thinking";
import type { ThinkingStep } from "@/lib/afm/types";

const MODES: { id: SwarmMode; label: string; icon: typeof Users }[] = [
  { id: "single", label: "Single AI", icon: Bot },
  { id: "swarm", label: "Swarm AI", icon: Users },
  { id: "auto", label: "Auto AI", icon: Sparkles },
  { id: "debate", label: "Debate", icon: Swords },
  { id: "research", label: "Research", icon: Search },
];

export function SwarmChat() {
  const [mode, setMode] = useState<SwarmMode>("swarm");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [agents, setAgents] = useState<SwarmAgentStatus[]>([]);
  const [thinking, setThinking] = useState<ThinkingStep[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, agents, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userTurn: ChatTurn = { role: "user", content: text };
    const next = [...messages, userTurn];
    setMessages(next);
    setInput("");
    setLoading(true);

    const thinkLabels =
      mode === "debate"
        ? ["GPT drafting…", "DeepSeek challenging…", "Gemini merging…"]
        : mode === "research"
          ? ["Gemini researching…", "Grok analyzing trends…", "Merging insights…"]
          : ["Intent analyzer…", "AI router…", "Memory retrieval…", "Swarm collaboration…"];

    setThinking(
      thinkLabels.map((label, i) => ({
        id: `t${i}`,
        label,
        status: i === 0 ? "active" : "pending",
      }))
    );

    try {
      const res = await fetch("/api/afm/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: data.error ?? "Swarm failed",
          description: data.message,
          variant: "destructive",
        });
        setMessages((m) => m.slice(0, -1));
        setInput(text);
        setThinking([]);
        return;
      }

      setAgents(data.agents ?? []);
      setThinking((t) => t.map((s) => ({ ...s, status: "done" as const })));
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      setMessages((m) => m.slice(0, -1));
      setInput(text);
      setThinking([]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, mode]);

  return (
    <div className="space-y-4">
      <Card className="glass-card border-violet-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-500" />
            {AFM_AI_NAME} Swarm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as SwarmMode)}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {MODES.map((m) => (
                <TabsTrigger key={m.id} value={m.id} className="text-xs gap-1">
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {(loading || agents.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <LiveThinkingPanel steps={thinking} />
          <Card className="glass-card">
            <CardContent className="pt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Agent status
              </p>
              {loading && !agents.length && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Spawning agents…
                </p>
              )}
              {agents.map((a) => (
                <div
                  key={a.provider}
                  className="flex items-center justify-between text-sm rounded-lg bg-muted/50 px-3 py-2"
                >
                  <span className="font-medium">[{a.displayName}]</span>
                  <span
                    className={cn(
                      "text-xs capitalize",
                      a.status === "thinking" && "text-violet-500",
                      a.status === "done" && "text-green-600",
                      a.status === "error" && "text-destructive"
                    )}
                  >
                    {a.status === "thinking" ? "thinking…" : a.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-card flex flex-col min-h-[420px] h-[calc(100vh-22rem)]">
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {!messages.length && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Try: &quot;Create tourism marketing campaign&quot; — Swarm routes
                strategy, research, copy, SEO, and video to different AIs.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={cn(
                  "max-w-[92%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted/80 border"
                )}
              >
                {m.content}
              </div>
            ))}
          </div>
          <div className="border-t p-4 flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message the swarm…"
              rows={2}
              className="resize-none min-h-[52px]"
              disabled={loading}
            />
            <Button
              variant="gradient"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => {
                setMessages([]);
                setAgents([]);
                setThinking([]);
              }}
              disabled={!messages.length}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
