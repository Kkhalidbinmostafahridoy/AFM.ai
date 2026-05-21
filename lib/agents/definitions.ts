export type AgentId =
  | "alarm"
  | "social"
  | "auto-comment"
  | "content"
  | "research";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[];
  icon: string;
}

export const AFM_AGENTS: AgentDefinition[] = [
  {
    id: "alarm",
    name: "Alarm & Reminder Agent",
    description:
      "Create one-time or recurring reminders with browser notifications and optional email.",
    capabilities: [
      "Scheduled alarms",
      "Recurring reminders",
      "Browser push notifications",
      "Email reminders (when configured)",
    ],
    icon: "bell",
  },
  {
    id: "social",
    name: "Social Media Agent",
    description:
      "Generate Facebook, X/Twitter, and LinkedIn posts with hashtags and schedule publishing.",
    capabilities: [
      "Post generation",
      "Hashtag suggestions",
      "Schedule posts",
      "Auto-publish when channel connected",
    ],
    icon: "share",
  },
  {
    id: "auto-comment",
    name: "Auto Comment Agent",
    description:
      "Monitor topics on X/Twitter and draft intelligent replies with toxicity filtering.",
    capabilities: [
      "Topic monitoring",
      "AI reply drafts",
      "Toxicity filter",
      "Rate-limited auto-reply",
    ],
    icon: "message",
  },
  {
    id: "content",
    name: "Content Automation Agent",
    description:
      "Daily content ideas, captions, thumbnails prompts, and engagement summaries.",
    capabilities: [
      "Daily content plan",
      "Thumbnail prompts",
      "Caption packs",
      "Engagement analysis",
    ],
    icon: "sparkles",
  },
  {
    id: "research",
    name: "Research Agent",
    description:
      "Web-style research summaries, trend tracking, and structured reports.",
    capabilities: [
      "Trend summaries",
      "News-style briefs",
      "Citation-style references",
      "Scheduled reports",
    ],
    icon: "search",
  },
];

export function getAgent(id: string): AgentDefinition | undefined {
  return AFM_AGENTS.find((a) => a.id === id);
}
