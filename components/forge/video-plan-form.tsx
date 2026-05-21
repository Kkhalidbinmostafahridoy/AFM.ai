"use client";

import { useState } from "react";
import { Loader2, Clapperboard, Download } from "lucide-react";
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
import { PLATFORMS, DURATIONS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import type { VideoPlanResult } from "@/lib/gemini/generate-video-plan";
import type { PipelineOutput } from "@/lib/pipeline/types";
import { PipelineOutputView } from "@/components/forge/pipeline-output";
import { downloadJSON } from "@/lib/utils";
import Link from "next/link";

interface VideoPlanFormProps {
  supabaseReady?: boolean;
}

export function VideoPlanForm({ supabaseReady = true }: VideoPlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState("30");
  const [plan, setPlan] = useState<VideoPlanResult | null>(null);
  const [pipeline, setPipeline] = useState<PipelineOutput | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) {
      toast({
        title: "Supabase not configured",
        description: "Add Supabase keys to .env.local and restart.",
        variant: "destructive",
      });
      return;
    }
    if (!topic.trim()) {
      toast({ title: "Topic required", variant: "destructive" });
      return;
    }

    setLoading(true);
    setPlan(null);
    setPipeline(null);
    try {
      const res = await fetch("/api/forge/video-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          duration,
          language: "en",
          tone: "energetic",
          audience: "general",
          contentStyle: "storytelling",
          renderMedia: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503 || res.status === 502) {
          toast({
            title: data.error ?? "Gemini unavailable",
            description:
              data.message ??
              "Model busy — wait and retry, or use fewer scenes (PIPELINE_MAX_SCENES=1).",
            variant: "destructive",
          });
        } else if (res.status === 429) {
          toast({
            title: "Daily limit reached",
            description: "Upgrade to Premium for unlimited use.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error ?? "Request failed",
            variant: "destructive",
          });
        }
        return;
      }
      setPlan(data.plan);
      setPipeline(data.pipeline ?? null);
      toast({
        title: data.pipeline ? "Video ready to preview" : "Shot plan ready",
        description: data.pipeline
          ? "Images, narration, and subtitles were generated automatically."
          : "Timeline generated — media pipeline did not complete.",
      });
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-violet-500" />
            AI video production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 3 habits that doubled my energy"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Generates shot plan, scene images, AI voice, and subtitles automatically.
              For script-only control use{" "}
              <Link href="/dashboard/generate" className="underline">
                Script Generator
              </Link>
              .
            </p>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building video…
                </>
              ) : (
                <>
                  <Clapperboard className="h-4 w-4" />
                  Generate video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card min-h-[360px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {pipeline ? "Your video" : "Output"}
          </CardTitle>
          {plan && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadJSON({ plan, pipeline }, `viralforge-video-${topic.slice(0, 16)}.json`)}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              Gemini is planning your video, then generating images and narration…
            </p>
          ) : pipeline ? (
            <PipelineOutputView pipeline={pipeline} plan={plan} />
          ) : plan ? (
            <PipelineOutputView
              pipeline={{
                jobType: "video_plan",
                status: "partial",
                renderMode: "slideshow",
                voiceover: plan.voiceover ?? "",
                title: topic,
                aspectRatio: plan.aspect_ratio ?? "9:16",
                scenes: [],
                subtitles: [],
                warnings: ["Media pipeline did not return assets. Check GEMINI_API_KEY and image/TTS quotas."],
              }}
              plan={plan}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              Vertical video preview with narration and burned-in subtitles will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}