"use client";

import type { WorkspaceMode } from "@/lib/afm/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Clapperboard,
  Megaphone,
  Palette,
  LayoutGrid,
} from "lucide-react";

const WORKSPACE_PANELS: Record<
  WorkspaceMode,
  { title: string; icon: typeof Code2; tools: { label: string; href: string }[] }
> = {
  code: {
    title: "Developer workspace",
    icon: Code2,
    tools: [
      { label: "Swarm AI (code mode)", href: "/dashboard/swarm" },
      { label: "Classic chat", href: "/dashboard/chat" },
      { label: "Agent studio", href: "/dashboard/core/agent-studio" },
    ],
  },
  video: {
    title: "Video production workspace",
    icon: Clapperboard,
    tools: [
      { label: "Video shot plan", href: "/dashboard/forge/video" },
      { label: "Viral video workflow", href: "/dashboard/automation/workflows" },
      { label: "Video analysis", href: "/dashboard/forge/analyze" },
    ],
  },
  marketing: {
    title: "Marketing workspace",
    icon: Megaphone,
    tools: [
      { label: "Campaign workflow", href: "/dashboard/automation/workflows" },
      { label: "Swarm AI", href: "/dashboard/swarm" },
      { label: "Script generator", href: "/dashboard/generate" },
    ],
  },
  design: {
    title: "Design workspace",
    icon: Palette,
    tools: [
      { label: "AI images", href: "/dashboard/forge/images" },
      { label: "Image edit", href: "/dashboard/forge/image-edit" },
    ],
  },
  general: {
    title: "General workspace",
    icon: LayoutGrid,
    tools: [
      { label: "Swarm AI", href: "/dashboard/swarm" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
};

export function AdaptiveWorkspace({ mode }: { mode: WorkspaceMode }) {
  const panel = WORKSPACE_PANELS[mode];
  const Icon = panel.icon;

  return (
    <Card className="glass-card border-violet-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-violet-500" />
          {panel.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {panel.tools.map((t) => (
          <Button key={t.href} variant="outline" size="sm" asChild>
            <Link href={t.href}>{t.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
