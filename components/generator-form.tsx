"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PLATFORMS,
  TONES,
  AUDIENCES,
  CONTENT_STYLES,
  DURATIONS,
  LANGUAGES,
} from "@/lib/constants";
import type { GeneratedScript, ScriptFormData } from "@/types";
import { ScriptOutput } from "@/components/script-output";
import { ScriptOutputSkeleton } from "@/components/script-output-skeleton";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface GeneratorFormProps {
  credits?: { remaining: number; plan: string; limit: number };
  supabaseReady?: boolean;
}

export function GeneratorForm({ credits, supabaseReady = true }: GeneratorFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedScript | null>(null);
  const [topic, setTopic] = useState("");

  const [form, setForm] = useState<ScriptFormData>({
    topic: "",
    language: "en",
    tone: "energetic",
    platform: "tiktok",
    duration: "30",
    audience: "general",
    contentStyle: "storytelling",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) {
      toast({
        title: "Supabase not configured",
        description: "Add Supabase keys to .env.local and restart the dev server.",
        variant: "destructive",
      });
      return;
    }

    if (!form.topic.trim()) {
      toast({ title: "Error", description: "Please enter a video topic", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    setTopic(form.topic);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503 || res.status === 502) {
          toast({
            title:
              typeof data.error === "string"
                ? data.error
                : res.status === 503
                  ? "Service unavailable"
                  : "AI configuration error",
            description:
              typeof data.message === "string"
                ? data.message
                : res.status === 503
                  ? "Gemini may be busy — wait 30–60s or use AI Chat with Flash Lite."
                  : "Check GEMINI_API_KEY in .env.local and restart the dev server.",
            variant: "destructive",
          });
        } else if (res.status === 429) {
          toast({
            title: "Daily limit reached",
            description: "Upgrade to Premium for unlimited generations",
            variant: "destructive",
          });
        } else {
          toast({ title: "Error", description: data.error || "Generation failed", variant: "destructive" });
        }
        return;
      }

      setResult(data.script);
      toast({
        title: "Script generated!",
        description: credits?.plan === "premium"
          ? "Unlimited generations"
          : `${data.credits.remaining} generations remaining today`,
      });
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Script Generator
          </CardTitle>
          {credits && credits.plan !== "premium" && (
            <p className="text-sm text-muted-foreground">
              {credits.remaining}/{credits.limit} generations left today
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Video Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g. 5 morning habits that changed my life"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => setForm({ ...form, platform: v as ScriptFormData["platform"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={form.duration}
                  onValueChange={(v) => setForm({ ...form, duration: v as ScriptFormData["duration"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v as ScriptFormData["language"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Select
                  value={form.tone}
                  onValueChange={(v) => setForm({ ...form, tone: v as ScriptFormData["tone"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) => setForm({ ...form, audience: v as ScriptFormData["audience"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Content Style</Label>
                <Select
                  value={form.contentStyle}
                  onValueChange={(v) => setForm({ ...form, contentStyle: v as ScriptFormData["contentStyle"] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_STYLES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={loading || !supabaseReady}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>

            {credits?.remaining === 0 && credits.plan !== "premium" && (
              <p className="text-center text-sm text-muted-foreground">
                Need more?{" "}
                <Link href="/pricing" className="text-primary hover:underline">
                  Upgrade to Premium
                </Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        {loading && <ScriptOutputSkeleton />}
        {result && !loading && (
          <ScriptOutput script={result} topic={topic} />
        )}
        {!loading && !result && (
          <Card className="glass-card h-full min-h-[400px] flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Your generated script will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
