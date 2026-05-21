/** AFM.ai OS module registry — maps sidebar items to routes and rollout phase. */

export type ModulePhase = 1 | 2 | 3 | 4;

export interface AfmModule {
  id: string;
  label: string;
  href: string;
  phase: ModulePhase;
  description: string;
  features: string[];
  live: boolean;
}

export const AFM_MODULES: AfmModule[] = [
  {
    id: "chat",
    label: "AI Chat",
    href: "/dashboard/chat",
    phase: 1,
    live: true,
    description: "Multi-model chat with voice, fusion, and structured answers.",
    features: ["Streaming", "Voice input", "Auto routing", "File context"],
  },
  {
    id: "swarm",
    label: "AI Swarm",
    href: "/dashboard/swarm",
    phase: 2,
    live: true,
    description: "Multiple AIs collaborate, debate, and merge consensus output.",
    features: ["Debate mode", "Research mode", "Agent status", "Voting merge"],
  },
  {
    id: "scripts",
    label: "Scripts",
    href: "/dashboard/generate",
    phase: 1,
    live: true,
    description: "Viral short-form scripts for TikTok, YouTube, Reels.",
    features: ["Hooks", "Hashtags", "Multi-platform", "PDF export"],
  },
  {
    id: "video",
    label: "AI Video Studio",
    href: "/dashboard/forge/video",
    phase: 1,
    live: true,
    description: "Shot plans, scenes, narration, and subtitles.",
    features: ["Storyboard", "TTS", "9:16 timeline", "Scene images"],
  },
  {
    id: "images",
    label: "Image Studio",
    href: "/dashboard/forge/images",
    phase: 1,
    live: true,
    description: "Text-to-image with Imagen and cinematic prompts.",
    features: ["Aspect ratios", "Styles", "Thumbnails"],
  },
  {
    id: "img2img",
    label: "Img → Img",
    href: "/dashboard/forge/image-edit",
    phase: 1,
    live: true,
    description: "Restyle and enhance reference images.",
    features: ["Edit prompts", "Reference upload"],
  },
  {
    id: "3d",
    label: "3D Generator",
    href: "/dashboard/studio/3d",
    phase: 3,
    live: false,
    description: "2D to 3D assets, rooms, and game objects.",
    features: ["Zero123", "Gaussian splat", "Blender export"],
  },
  {
    id: "translate",
    label: "Translator",
    href: "/dashboard/forge/translate",
    phase: 1,
    live: true,
    description: "Context-aware Bangla ↔ English and localization.",
    features: ["Natural tone", "Business mode", "Voice (Phase 2)"],
  },
  {
    id: "analyze",
    label: "AI Analyze",
    href: "/dashboard/forge/analyze",
    phase: 1,
    live: true,
    description: "Video link intelligence and recap generation.",
    features: ["URL teardown", "Transcript", "Viral score"],
  },
  {
    id: "workflows",
    label: "Workflow Automation",
    href: "/dashboard/automation/workflows",
    phase: 2,
    live: true,
    description: "One-click viral video and campaign pipelines.",
    features: ["Triggers", "Scheduled AI", "Auto content"],
  },
  {
    id: "agents",
    label: "AI Agents",
    href: "/dashboard/agents",
    phase: 2,
    live: false,
    description: "Autonomous marketing, coding, and research agents.",
    features: ["Browser control", "API actions", "Task memory"],
  },
  {
    id: "memory",
    label: "Memory Engine",
    href: "/dashboard/memory/projects",
    phase: 2,
    live: true,
    description: "Persistent preferences, projects, and business context.",
    features: ["Vector recall", "Goals", "Evolution log"],
  },
  {
    id: "research",
    label: "AI Research",
    href: "/dashboard/research",
    phase: 2,
    live: false,
    description: "Web research with citations and trend tracking.",
    features: ["Tavily", "Serper", "Academic mode"],
  },
  {
    id: "website",
    label: "AI Website Builder",
    href: "/dashboard/builders/website",
    phase: 3,
    live: false,
    description: "Full-stack sites, APIs, and deploy automation.",
    features: ["Next.js", "Prisma", "Supabase"],
  },
  {
    id: "business",
    label: "AI Business Builder",
    href: "/dashboard/builders/business",
    phase: 3,
    live: false,
    description: "Plans, brand identity, and growth strategy.",
    features: ["Logo", "Ads", "Revenue model"],
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/dashboard/integrations",
    phase: 2,
    live: true,
    description: "AI Connect — post and act across apps.",
    features: ["TikTok", "YouTube", "GitHub", "Shopify"],
  },
  {
    id: "monitor",
    label: "Live AI Monitor",
    href: "/dashboard/monitor",
    phase: 2,
    live: true,
    description: "Real-time agent thinking and API health.",
    features: ["Agent grid", "GPU placeholder", "Health checks"],
  },
];

export function getModuleByHref(href: string): AfmModule | undefined {
  return AFM_MODULES.find((m) => m.href === href || href.startsWith(m.href + "/"));
}
