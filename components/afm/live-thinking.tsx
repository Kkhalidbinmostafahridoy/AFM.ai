"use client";

import { cn } from "@/lib/utils";
import type { ThinkingStep } from "@/lib/afm/types";
import { Loader2, Check, Circle } from "lucide-react";

export function LiveThinkingPanel({
  steps,
  className,
}: {
  steps: ThinkingStep[];
  className?: string;
}) {
  if (!steps.length) return null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/30 p-4 space-y-2",
        className
      )}
    >
      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
        Live AI thinking
      </p>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-2 text-sm">
            {step.status === "done" ? (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            ) : step.status === "active" ? (
              <Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0" />
            ) : step.status === "error" ? (
              <Circle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            )}
            <span
              className={cn(
                step.status === "active" && "text-foreground font-medium",
                step.status === "pending" && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
