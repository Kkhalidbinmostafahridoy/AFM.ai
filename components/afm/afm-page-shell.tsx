import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { AFM_AI_NAME } from "@/lib/constants";
import type { ReactNode } from "react";

export function AfmPageShell({
  title,
  description,
  children,
  maxWidth = "max-w-4xl",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className={`p-6 md:p-8 mx-auto ${maxWidth}`}>
          <div className="mb-6">
            <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold uppercase tracking-wide mb-1">
              {AFM_AI_NAME} · AI Operating System
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
