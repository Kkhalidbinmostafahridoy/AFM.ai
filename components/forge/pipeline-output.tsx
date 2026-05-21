"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { SlideshowPlayer } from "@/components/forge/slideshow-player";
import { Button } from "@/components/ui/button";
import type { PipelineOutput } from "@/lib/pipeline/types";
import type { VideoPlanResult } from "@/lib/gemini/generate-video-plan";

interface PipelineOutputViewProps {
  pipeline: PipelineOutput;
  plan?: VideoPlanResult | null;
}

export function PipelineOutputView({ pipeline, plan }: PipelineOutputViewProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">{pipeline.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
          {pipeline.voiceover}
        </p>
      </div>

      <SlideshowPlayer pipeline={pipeline} />

      {pipeline.translations && (
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">English</p>
            <p className="font-medium">{pipeline.translations.en.title}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">বাংলা</p>
            <p className="font-medium">{pipeline.translations.bn.title}</p>
          </div>
        </div>
      )}

      {pipeline.warnings?.length ? (
        <div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            {pipeline.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setShowTechnical((v) => !v)}
        >
          {showTechnical ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide technical plan
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show technical plan (JSON)
            </>
          )}
        </Button>
      )}

      {showTechnical && plan && (
        <pre className="text-xs bg-muted/50 rounded-xl p-4 overflow-auto max-h-[320px]">
          {JSON.stringify(plan, null, 2)}
        </pre>
      )}
    </div>
  );
}
