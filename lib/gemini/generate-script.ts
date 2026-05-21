import { buildScriptPrompt } from "@/prompts/script-generator";
import type { GeneratedScript, ScriptFormData } from "@/types";
import { generateGeminiJson } from "./generate-json";

const SYSTEM = `You are ViralForge AI — an elite short-form video strategist.
Always output a single JSON object matching the schema described in the user message.
Do not wrap JSON in markdown fences.`;

export async function generateScript(
  formData: ScriptFormData
): Promise<GeneratedScript> {
  const userPrompt = buildScriptPrompt(formData);

  const parsed = await generateGeminiJson<GeneratedScript>({
    systemInstruction: SYSTEM,
    prompt: userPrompt,
    temperature: 0.85,
  });

  if (!parsed.hook || !parsed.script || !parsed.caption) {
    throw new Error("Invalid script format from Gemini");
  }

  if (!Array.isArray(parsed.hashtags)) {
    parsed.hashtags = [];
  }
  if (!parsed.cta) parsed.cta = "";
  if (!parsed.thumbnail_idea) parsed.thumbnail_idea = "";
  if (!parsed.music_suggestion) parsed.music_suggestion = "";

  if (!Array.isArray(parsed.sections) || parsed.sections.length < 3) {
    parsed.sections = buildFallbackSections(parsed);
  }

  if (!Array.isArray(parsed.video_prompts)) {
    parsed.video_prompts = parsed.script.map(
      (s, i) =>
        `Scene ${i + 1}: ${s.scene.slice(0, 200)} — vertical 9:16, cinematic lighting, ${formData.platform}`
    );
  }

  if (!parsed.thumbnail_prompt?.trim()) {
    parsed.thumbnail_prompt = parsed.thumbnail_idea;
  }

  return parsed;
}

function buildFallbackSections(
  script: GeneratedScript
): NonNullable<GeneratedScript["sections"]> {
  const scenes = script.script;
  const third = Math.max(1, Math.ceil(scenes.length / 3));
  const hookScenes = scenes.slice(0, third);
  const storyScenes = scenes.slice(third, third * 2);
  const ctaScenes = scenes.slice(third * 2);

  const pack = (
    label: string,
    slice: typeof scenes
  ): NonNullable<GeneratedScript["sections"]>[0] => ({
    section: label,
    scene: slice.map((s) => s.scene).join(" | ") || "—",
    voiceover: slice.map((s) => s.voiceover).join(" "),
    camera: slice.map((s) => s.camera_angle || "Dynamic handheld").join(" → "),
    subtitle: slice[0]?.voiceover?.slice(0, 80) || "",
    music: label === "Hook" ? "High-energy pulse" : label === "Story" ? "Emotional build" : "Anthem / resolve",
    transition: label === "Hook" ? "Hard cut / speed ramp" : label === "Story" ? "Whip pan / L-cut" : "Logo sting / whoosh",
  });

  return [
    pack("Hook", hookScenes.length ? hookScenes : scenes.slice(0, 1)),
    pack("Story", storyScenes.length ? storyScenes : scenes.slice(1, 2)),
    pack("CTA", ctaScenes.length ? ctaScenes : scenes.slice(-1)),
  ];
}
