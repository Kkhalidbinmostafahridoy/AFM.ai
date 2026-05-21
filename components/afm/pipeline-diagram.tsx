const DEFAULT_STEPS = [
  "Prompt",
  "Intent Analyzer",
  "AI Router",
  "Best AI Selection",
  "Memory Retrieval",
  "Multi-Agent Collaboration",
  "Response Generator",
];

export function PipelineDiagram({ steps = DEFAULT_STEPS }: { steps?: string[] }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4 overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 min-w-max">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <span className="text-xs font-medium px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 whitespace-nowrap">
              {step}
            </span>
            {i < steps.length - 1 && (
              <span className="text-muted-foreground hidden sm:inline">↓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
