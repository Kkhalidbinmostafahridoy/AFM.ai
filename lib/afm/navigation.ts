import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  History,
  Settings,
  Clapperboard,
  Image,
  Wand2,
  ScanSearch,
  Languages,
  Users,
  Brain,
  Bot,
  Zap,
  Plug,
  Box,
  Search,
  Globe,
  Briefcase,
  Activity,
  Shield,
  Cpu,
  GraduationCap,
  Monitor,
  BarChart3,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavLink[];
}

/** Official AFM.ai OS sidebar — matches product spec. */
export const AFM_NAV_SECTIONS: NavSection[] = [
  {
    id: "command",
    label: "Command",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/workspace", label: "Adaptive Workspace", icon: Monitor },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    items: [
      { href: "/dashboard/chat", label: "AI Chat", icon: MessageSquare },
      { href: "/dashboard/swarm", label: "AI Swarm", icon: Users, badge: "Live" },
      { href: "/dashboard/research", label: "AI Research", icon: Search, badge: "Live" },
    ],
  },
  {
    id: "studio",
    label: "Creative Studio",
    items: [
      { href: "/dashboard/generate", label: "Scripts", icon: Sparkles },
      { href: "/dashboard/forge/video", label: "AI Video Studio", icon: Clapperboard },
      { href: "/dashboard/forge/images", label: "Image Studio", icon: Image },
      { href: "/dashboard/forge/image-edit", label: "Img → Img", icon: Wand2 },
      { href: "/dashboard/studio/3d", label: "3D Generator", icon: Box, badge: "Soon" },
      { href: "/dashboard/forge/translate", label: "Translator", icon: Languages },
      { href: "/dashboard/forge/analyze", label: "AI Analyze", icon: ScanSearch },
    ],
  },
  {
    id: "automation",
    label: "Automation",
    items: [
      { href: "/dashboard/automation/workflows", label: "Workflow Automation", icon: Zap },
      { href: "/dashboard/agents", label: "AI Agents", icon: Bot, badge: "Live" },
      { href: "/dashboard/memory/projects", label: "Memory Engine", icon: Brain },
    ],
  },
  {
    id: "builders",
    label: "Builders",
    items: [
      { href: "/dashboard/builders/website", label: "AI Website Builder", icon: Globe, badge: "Live" },
      { href: "/dashboard/builders/business", label: "AI Business Builder", icon: Briefcase, badge: "Live" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, badge: "Live" },
      { href: "/dashboard/monitor", label: "Live AI Monitor", icon: Activity },
      { href: "/dashboard/history", label: "History", icon: History },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/admin", label: "Admin Panel", icon: Shield, badge: "Soon" },
    ],
  },
];

/** Legacy deep links — redirect targets */
export const AFM_LEGACY_REDIRECTS: Record<string, string> = {
  "/dashboard/core/router": "/dashboard/workspace",
  "/dashboard/core/swarm": "/dashboard/swarm",
  "/dashboard/core/memory": "/dashboard/memory/projects",
  "/dashboard/core/agent-studio": "/dashboard/agents",
  "/dashboard/core/workflow-engine": "/dashboard/automation/workflows",
  "/dashboard/core/intelligence-graph": "/dashboard/monitor",
  "/dashboard/automation/pipelines": "/dashboard/forge/video",
};

export const INTEGRATION_CHANNELS = [
  { id: "gmail", name: "Gmail", status: "coming_soon" as const },
  { id: "whatsapp", name: "WhatsApp", status: "coming_soon" as const },
  { id: "telegram", name: "Telegram", status: "coming_soon" as const },
  { id: "tiktok", name: "TikTok", status: "coming_soon" as const },
  { id: "youtube", name: "YouTube", status: "coming_soon" as const },
  { id: "github", name: "GitHub", status: "coming_soon" as const },
  { id: "shopify", name: "Shopify", status: "coming_soon" as const },
  { id: "notion", name: "Notion", status: "coming_soon" as const },
  { id: "wordpress", name: "WordPress", status: "coming_soon" as const },
  { id: "slack", name: "Slack", status: "coming_soon" as const },
  { id: "discord", name: "Discord", status: "coming_soon" as const },
  { id: "facebook", name: "Facebook", status: "coming_soon" as const },
  { id: "twitter", name: "X (Twitter)", status: "coming_soon" as const },
  { id: "linkedin", name: "LinkedIn", status: "coming_soon" as const },
];

export const AI_PERSONALITIES = [
  { id: "creative", label: "Creative Mode", icon: Sparkles },
  { id: "business", label: "Business Mode", icon: Briefcase },
  { id: "developer", label: "Developer Mode", icon: Cpu },
  { id: "teacher", label: "Teacher Mode", icon: GraduationCap },
  { id: "emotional", label: "Emotional Mode", icon: Users },
  { id: "autonomous", label: "Autonomous Mode", icon: Bot },
] as const;

export type PersonalityId = (typeof AI_PERSONALITIES)[number]["id"];
export type OperatingMode = "assistant" | "agent" | "autonomous";
