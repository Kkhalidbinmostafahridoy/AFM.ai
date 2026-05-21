"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface ImageEditForgeFormProps {
  supabaseReady?: boolean;
}

export function ImageEditForgeForm({ supabaseReady = true }: ImageEditForgeFormProps) {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) {
      toast({ title: "Supabase not configured", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Upload an image", variant: "destructive" });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: "Enter an edit prompt", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSrc(null);
    try {
      const fd = new FormData();
      fd.set("image", file);
      fd.set("prompt", prompt.trim());

      const res = await fetch("/api/forge/image-edit", {
        method: "POST",
        body: fd,
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
      setSrc(`data:${data.mimeType ?? "image/png"};base64,${data.imageBase64}`);
      toast({ title: "Image edited" });
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
            <Wand2 className="h-5 w-5 text-violet-500" />
            Image → image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Source image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Edit prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Convert to cinematic teal-orange grade, add soft film grain…"
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Editing…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Apply AI edit
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card min-h-[360px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">Result</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-4">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Edited"
              className="max-h-[560px] w-auto max-w-full rounded-xl shadow-lg border"
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Edited image preview appears here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
