import { classifyTask } from "@/lib/ai/router";
import type { IntentAnalysis, WorkspaceMode } from "./types";
import { getCampaignTaskRoutes } from "./task-router";

function detectWorkspaceMode(text: string): WorkspaceMode {
  const t = text.toLowerCase();
  if (
    /\b(website|react|next\.?js|api|database|deploy|component|typescript|code)\b/.test(
      t
    )
  ) {
    return "code";
  }
  if (
    /\b(movie|film|storyboard|scene|subtitle|voice over|video|tiktok|reel|short)\b/.test(
      t
    )
  ) {
    return "video";
  }
  if (
    /\b(campaign|marketing|seo|brand|ads|tourism|viral|hook|caption)\b/.test(t)
  ) {
    return "marketing";
  }
  if (/\b(design|figma|ui|ux|logo|mockup|layout)\b/.test(t)) {
    return "design";
  }
  return "general";
}

function suggestWorkflow(text: string, mode: WorkspaceMode): string | undefined {
  if (mode === "video" || /\bviral video\b/i.test(text)) {
    return "viral-video";
  }
  if (mode === "marketing" || /\bcampaign\b/i.test(text)) {
    return "marketing-campaign";
  }
  if (mode === "code") return "build-website";
  return undefined;
}

export function analyzeIntent(userMessage: string): IntentAnalysis {
  const taskCategory = classifyTask(userMessage);
  const workspaceMode = detectWorkspaceMode(userMessage);
  const t = userMessage.toLowerCase();

  let intent = "General assistance";
  if (workspaceMode === "marketing") intent = "Marketing & growth";
  else if (workspaceMode === "video") intent = "Video production";
  else if (workspaceMode === "code") intent = "Software development";
  else if (workspaceMode === "design") intent = "Design & visuals";

  const subtasks =
    workspaceMode === "marketing" || /\bcampaign\b/i.test(t)
      ? getCampaignTaskRoutes()
      : [];

  return {
    intent,
    workspaceMode,
    taskCategory,
    confidence: subtasks.length ? 0.92 : 0.78,
    suggestedWorkflow: suggestWorkflow(userMessage, workspaceMode),
    subtasks,
  };
}
