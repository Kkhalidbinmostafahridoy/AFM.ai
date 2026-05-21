"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AI_PERSONALITIES,
  type OperatingMode,
  type PersonalityId,
} from "@/lib/afm/navigation";
import { loadPrefs, savePrefs } from "@/lib/afm/memory-store";
import { cn } from "@/lib/utils";

const MODES: { id: OperatingMode; label: string; desc: string }[] = [
  { id: "assistant", label: "Assistant Mode", desc: "Normal chat AI" },
  { id: "agent", label: "Agent Mode", desc: "AI breaks work into tasks" },
  { id: "autonomous", label: "Autonomous Mode", desc: "Continuous background planning (Phase 3)" },
];

export function PersonalitySettings() {
  const [personality, setPersonality] = useState<PersonalityId>("business");
  const [operatingMode, setOperatingMode] = useState<OperatingMode>("assistant");

  useEffect(() => {
    const p = loadPrefs();
    setPersonality(p.personality);
    setOperatingMode(p.operatingMode);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Personality Engine</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          {AI_PERSONALITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPersonality(p.id);
                savePrefs({ personality: p.id });
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors",
                personality === p.id
                  ? "border-violet-500 bg-violet-500/10"
                  : "hover:bg-muted/50"
              )}
            >
              <p.icon className="h-4 w-4 text-violet-500" />
              {p.label}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>AI Operating Modes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MODES.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <Label>{m.label}</Label>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <Switch
                checked={operatingMode === m.id}
                onCheckedChange={(on) => {
                  if (on) {
                    setOperatingMode(m.id);
                    savePrefs({ operatingMode: m.id });
                  }
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
