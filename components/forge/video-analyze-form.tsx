"use client";

import { useState } from "react";
import { Loader2, ScanSearch, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { VideoAnalysisResult } from "@/lib/gemini/analyze-video";
import type { PipelineOutput } from "@/lib/pipeline/types";
import { AnalysisReport } from "@/components/forge/analysis-report";
import { PipelineOutputView } from "@/components/forge/pipeline-output";
import { downloadJSON } from "@/lib/utils";

interface VideoAnalyzeFormProps {
  supabaseReady?: boolean;
}

export function VideoAnalyzeForm({ supabaseReady = true }: VideoAnalyzeFormProps) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [pipeline, setPipeline] = useState<PipelineOutput | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) {
      toast({ title: "Supabase not configured", variant: "destructive" });
      return;
    }
    try {
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setPipeline(null);
    try {
      const res = await fetch("/api/forge/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: url.trim(),
          transcript: transcript.trim() || undefined,
          renderRecap: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Error",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      setAnalysis(data.analysis);
      setPipeline(data.pipeline ?? null);
      toast({
        title: data.pipeline ? "Recap video ready" : "Analysis complete",
        description: data.pipeline
          ? "AI recap with narration and scenes is ready to preview."
          : "Teardown complete — recap media did not generate.",
      });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-violet-500" />
            Video link intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>YouTube / TikTok / Facebook URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Transcript or captions (strongly recommended)</Label>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                placeholder="Paste auto-captions or a rough transcript for grounded analysis and recap video."
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building recap…
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  Analyze &amp; create recap
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card min-h-[360px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {pipeline ? "AI recap video" : "Creator report"}
          </CardTitle>
          {analysis && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadJSON({ analysis, pipeline }, `viralforge-analysis-${url.slice(-12)}.json`)
              }
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              Analyzing structure, then generating recap scenes and narration…
            </p>
          ) : analysis ? (
            <>
              {pipeline && (
                <PipelineOutputView pipeline={pipeline} />
              )}
              <AnalysisReport analysis={analysis} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              Viral teardown plus narrated recap short will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
