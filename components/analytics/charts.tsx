"use client";

import { cn } from "@/lib/utils";

export function MetricBar({
  label,
  value,
  max,
  unit = "",
  className,
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">
          {value.toLocaleString()}
          {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Sparkline({
  data,
  height = 40,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data, 1);
  const w = 120;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={height}
      className={cn("text-violet-500", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  sub,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  trend?: number[];
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      {trend && trend.length > 0 && (
        <div className="mt-2">
          <Sparkline data={trend} />
        </div>
      )}
    </div>
  );
}
