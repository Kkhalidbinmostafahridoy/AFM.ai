"use client";

import { useState } from "react";
import { Building2, Globe, Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { WebsiteBuildResult } from "@/lib/builders/website-generator";
import type { DeployResult } from "@/lib/builders/deploy";

export function BusinessBuilderClient() {
  const [businessName, setBusinessName] = useState("My AI Startup");
  const [prompt, setPrompt] = useState(
    "SaaS AI productivity platform with pricing, blog, and signup"
  );
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [project, setProject] = useState<WebsiteBuildResult | null>(null);
  const [deployment, setDeployment] = useState<DeployResult | null>(null);

  const buildWebsite = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setDeployment(null);
    try {
      const res = await fetch("/api/builders/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
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
      toast({
        title: "Website generated",
        description: `${data.files?.length ?? 0} files ready to deploy`,
      });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deploy = async () => {
    if (!project || deploying) return;
    setDeploying(true);
    try {
      const res = await fetch("/api/builders/business/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, project }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Deploy failed",
          variant: "destructive",
        });
        return;
      }
      setDeployment(data.deployment as DeployResult);
      toast({
        title: "Deployed",
        description: data.deployment?.url,
      });
    } catch {
      toast({ title: "Deploy failed", variant: "destructive" });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-violet-500" />
            Business profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Business name</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Website prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" onClick={buildWebsite} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Build website with AI
            </Button>
            <Button
              variant="outline"
              onClick={deploy}
              disabled={!project || deploying}
            >
              {deploying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Deploy live
            </Button>
          </div>
        </CardContent>
      </Card>

      {project && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Generated stack</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>{project.stack.frontend}</p>
            <p>{project.stack.backend}</p>
            <p>
              {project.files.length} files ·{" "}
              {project.readme
                .replace(/```[\s\S]*?```/g, " ")
                .replace(/[#*`]/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 120)}
              …
            </p>
          </CardContent>
        </Card>
      )}

      {deployment && (
        <Card className="glass-card border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400">
              Live deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a
              href={deployment.url}
              target="_blank"
              rel="noreferrer"
              className="text-violet-600 hover:underline break-all"
            >
              {deployment.url}
            </a>
            <ul className="font-mono text-xs text-muted-foreground space-y-1">
              {deployment.logs.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
