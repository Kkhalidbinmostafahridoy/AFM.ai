"use client";

import { useState } from "react";
import { Loader2, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { WebsiteBuildResult } from "@/lib/builders/website-generator";

export function WebsiteBuilderClient() {
  const [prompt, setPrompt] = useState(
    "Build a modern tourism landing page with booking CTA, gallery, and contact form"
  );
  const [frontend, setFrontend] = useState("Next.js 15 (App Router)");
  const [backend, setBackend] = useState("Next.js API Routes");
  const [database, setDatabase] = useState("PostgreSQL + Prisma");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<WebsiteBuildResult | null>(null);
  const [activeFile, setActiveFile] = useState(0);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setProject(null);
    try {
      const res = await fetch("/api/builders/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          frontend,
          backend,
          database,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Build failed",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      setProject(data as WebsiteBuildResult);
      setActiveFile(0);
      toast({ title: "Website generated", description: `${data.files?.length ?? 0} files` });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportZipHint = () => {
    if (!project?.files?.length) return;
    const blob = new Blob(
      [
        project.files
          .map((f) => `// ${f.path}\n${f.content}`)
          .join("\n\n---\n\n"),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "afm-website-project.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-violet-500" />
            Describe your website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Frontend</Label>
              <Select value={frontend} onValueChange={setFrontend}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Next.js 15 (App Router)">Next.js</SelectItem>
                  <SelectItem value="React 19 + Vite">React</SelectItem>
                  <SelectItem value="Vue 3 + Nuxt">Vue / Nuxt</SelectItem>
                  <SelectItem value="SvelteKit">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Backend</Label>
              <Select value={backend} onValueChange={setBackend}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Next.js API Routes">Node / Next API</SelectItem>
                  <SelectItem value="Express.js">Express</SelectItem>
                  <SelectItem value="NestJS">NestJS</SelectItem>
                  <SelectItem value="FastAPI (Python)">FastAPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Database</Label>
              <Select value={database} onValueChange={setDatabase}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PostgreSQL + Prisma">PostgreSQL</SelectItem>
                  <SelectItem value="MongoDB + Mongoose">MongoDB</SelectItem>
                  <SelectItem value="Supabase">Supabase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button variant="gradient" onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Generate full-stack project
          </Button>
        </CardContent>
      </Card>

      {project && (
        <div className="grid lg:grid-cols-4 gap-4 min-h-[400px]">
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {project.files.map((f, i) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setActiveFile(i)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg truncate ${
                    activeFile === i ? "bg-violet-500/15" : "hover:bg-muted/50"
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="glass-card lg:col-span-3">
            <CardHeader className="flex flex-row justify-between items-center pb-2">
              <CardTitle className="text-sm font-mono">
                {project.files[activeFile]?.path ?? "Preview"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportZipHint}>
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-[480px] p-3 rounded-lg bg-muted/40 border whitespace-pre-wrap">
                {project.files[activeFile]?.content ?? project.readme}
              </pre>
              <p className="text-xs text-muted-foreground mt-3">{project.deployNotes}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
