"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AFM_MODULES } from "@/lib/afm/modules";
import { PipelineDiagram } from "@/components/afm/pipeline-diagram";
import {
  Zap,
  Users,
  Clapperboard,
  Image as ImageIcon,
  Activity,
  Bot,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface ProviderRow {
  id: string;
  label: string;
  configured: boolean;
}

export function CommandCenter({
  plan,
  creditsRemaining,
  scriptCount,
}: {
  plan: string;
  creditsRemaining: string;
  scriptCount: number;
}) {
  const [providers, setProviders] = useState<ProviderRow[]>([]);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { providers?: ProviderRow[] }) => {
        if (d.providers) setProviders(d.providers);
      })
      .catch(() => undefined);
  }, []);

  const configured = providers.filter((p) => p.configured).length;
  const liveModules = AFM_MODULES.filter((m) => m.live);

  return (
    <div className="space-y-8">
      <PipelineDiagram />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">AI Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xl font-bold">{creditsRemaining}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{plan} plan</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Models Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-500" />
              <span className="text-xl font-bold">{configured}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Providers configured</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <span className="text-xl font-bold">{configured || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Swarm-ready</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-xl font-bold">{scriptCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Video Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <Clapperboard className="h-5 w-5 text-violet-500 mb-1" />
            <Button variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/dashboard/forge/video">Open studio</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">AI Health</CardTitle>
          </CardHeader>
          <CardContent>
            <Activity className="h-5 w-5 text-green-500 mb-1" />
            <Button variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/dashboard/monitor">Monitor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Quick AI actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button variant="gradient" className="h-auto py-4 flex flex-col gap-1" asChild>
            <Link href="/dashboard/swarm">
              <Users className="h-5 w-5" />
              AI Swarm
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" asChild>
            <Link href="/dashboard/automation/workflows">
              <Zap className="h-5 w-5 text-violet-500" />
              Viral workflow
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" asChild>
            <Link href="/dashboard/forge/video">
              <Clapperboard className="h-5 w-5 text-violet-500" />
              Video studio
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-1" asChild>
            <Link href="/dashboard/forge/images">
              <ImageIcon className="h-5 w-5 text-violet-500" />
              Image studio
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">OS modules ({liveModules.length} live)</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AFM_MODULES.map((m) => (
            <Link
              key={m.id}
              href={m.href}
              className="rounded-xl border bg-card/50 p-4 hover:border-violet-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{m.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    m.live ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.live ? "Live" : `P${m.phase}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
