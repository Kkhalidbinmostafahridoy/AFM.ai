"use client";

import { useState } from "react";
import { Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface ImageForgeFormProps {
  supabaseReady?: boolean;
}

const ASPECTS = ["9:16", "1:1", "16:9", "3:4", "4:3"] as const;

export function ImageForgeForm({ supabaseReady = true }: ImageForgeFormProps) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>("9:16");
  const [src, setSrc] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) {
      toast({
        title: "Supabase not configured",
        variant: "destructive",
      });
      return;
    }
    if (prompt.trim().length < 8) {
      toast({ title: "Prompt too short", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSrc(null);
    try {
      const res = await fetch("/api/forge/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio: aspect,
          style: style.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Error",
          description: data.message ?? data.details?.fieldErrors?.prompt?.[0],
          variant: "destructive",
        });
        return;
      }
      setSrc(`data:${data.mimeType ?? "image/png"};base64,${data.imageBase64}`);
      toast({ title: "Image generated" });
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
            <ImageIcon className="h-5 w-5 text-violet-500" />
            Text → image (Gemini / Imagen)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Cinematic vertical thumbnail, neon rim light, confident creator at desk…"
              />
            </div>
            <div className="space-y-2">
              <Label>Style hint (optional)</Label>
              <Input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g. luxury minimal, anime, food macro"
              />
            </div>
            <div className="space-y-2">
              <Label>Aspect ratio</Label>
              <Select value={aspect} onValueChange={(v) => setAspect(v as (typeof ASPECTS)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECTS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  Generate image
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card min-h-[360px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-4">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Generated"
              className="max-h-[560px] w-auto max-w-full rounded-xl shadow-lg border"
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Generated image preview (PNG) appears here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
