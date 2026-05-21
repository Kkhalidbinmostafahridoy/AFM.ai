import type { WorkflowDefinition } from "./types";

export const AFM_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "viral-video",
    name: "Create Viral Video",
    description:
      "End-to-end: trend research → hooks → script → images → voice → subtitles (uses Content Forge APIs).",
    steps: [
      { id: "trend", label: "Researching trends…", action: "intent" },
      { id: "hooks", label: "Generating hooks…", action: "script_hooks" },
      { id: "script", label: "Writing script…", action: "generate_script" },
      { id: "images", label: "Creating scene images…", action: "scene_images" },
      { id: "voice", label: "Generating AI voice…", action: "tts" },
      { id: "subs", label: "Creating subtitles…", action: "subtitles" },
      { id: "plan", label: "Building shot plan…", action: "video_plan" },
    ],
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    description: "Multi-AI swarm: strategy, research, copy, SEO, video script, visuals.",
    steps: [
      { id: "intent", label: "Analyzing campaign intent…", action: "intent" },
      { id: "strategy", label: "Strategy (GPT)…", action: "swarm_strategy" },
      { id: "research", label: "Research (Gemini)…", action: "swarm_research" },
      { id: "copy", label: "Copywriting…", action: "swarm_copy" },
      { id: "seo", label: "SEO (DeepSeek)…", action: "swarm_seo" },
      { id: "merge", label: "Merging swarm output…", action: "swarm_merge" },
    ],
  },
  {
    id: "auto-content",
    name: "Auto Content Batch",
    description: "Generate scripts + captions for multiple platforms.",
    steps: [
      { id: "topic", label: "Parsing topic…", action: "intent" },
      { id: "script", label: "Writing script…", action: "generate_script" },
      { id: "image", label: "Hero image…", action: "hero_image" },
    ],
  },
];

export function getWorkflow(id: string): WorkflowDefinition | undefined {
  return AFM_WORKFLOWS.find((w) => w.id === id);
}
