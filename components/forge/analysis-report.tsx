"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoAnalysisResult } from "@/lib/gemini/analyze-video";

interface AnalysisReportProps {
  analysis: VideoAnalysisResult;
}

export function AnalysisReport({ analysis }: AnalysisReportProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  const cards = [
    { label: "Hook style", value: analysis.hook_style },
    { label: "Viral pattern", value: analysis.viral_pattern },
    { label: "Emotion", value: analysis.emotion_type },
    { label: "Viral score", value: analysis.viral_score },
    { label: "Retention", value: analysis.retention_strategy },
    { label: "CTA", value: analysis.cta_method },
  ];

  return (
    <div className="space-y-5">
      {analysis.recap_summary && (
        <div className="rounded-xl border bg-violet-500/5 border-violet-500/20 p-4">
          <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1">
            Recap summary
          </p>
          <p className="text-sm leading-relaxed">{analysis.recap_summary}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-sm font-medium mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {analysis.improvement_suggestions?.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Improvements</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {analysis.improvement_suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.similar_content_ideas?.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Content ideas</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            {analysis.similar_content_ideas.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

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
            Hide raw analysis JSON
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            Show raw analysis JSON
          </>
        )}
      </Button>

      {showTechnical && (
        <pre className="text-xs bg-muted/50 rounded-xl p-4 overflow-auto max-h-[320px]">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      )}
    </div>
  );
}
