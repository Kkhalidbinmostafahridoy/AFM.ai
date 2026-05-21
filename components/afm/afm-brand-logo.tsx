import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AFM_AI_NAME } from "@/lib/constants";

type AfmBrandLogoProps = {
  href?: string;
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
};

export function AfmBrandLogo({
  href = "/",
  className,
  showTagline = true,
  size = "md",
  onClick,
}: AfmBrandLogoProps) {
  const iconBox = size === "sm" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const titleClass = size === "sm" ? "text-base" : "text-lg";

  const content = (
    <div
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-muted/60",
        className
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 ring-1 ring-white/20",
          iconBox
        )}
      >
        <Zap className={cn(icon, "text-white drop-shadow-sm")} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
      </div>
      <div className="min-w-0">
        <span
          className={cn(
            "block font-bold leading-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-300 dark:to-indigo-300 bg-clip-text text-transparent",
            titleClass
          )}
        >
          {AFM_AI_NAME}
        </span>
        {showTagline && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            AI Operating System
          </span>
        )}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={`${AFM_AI_NAME} home`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 rounded-xl"
    >
      {content}
    </Link>
  );
}
