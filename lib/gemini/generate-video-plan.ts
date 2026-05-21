import { Type } from "@google/genai";
import { getGeminiClient } from "./client";
import { GEMINI_TEXT_MODEL } from "./models";
import type { ScriptFormData } from "@/types";

export interface MultilingualPlanCopy {
  title: string;
  voiceover: string;
}

export interface VideoPlanResult {
  aspect_ratio: "9:16" | "16:9";
  platform: string;
  timeline_seconds: number;
  voiceover: string;
  narration_script: string;
  translations: {
    en: MultilingualPlanCopy;
    bn: MultilingualPlanCopy;
  };
  shot_list: Array<{
    t_start: string;
    t_end: string;
    visual_prompt: string;
    image_prompt: string;
    video_prompt: string;
    subtitle: string;
    subtitle_bn?: string;
    transition: string;
    music_cue: string;
  }>;
  music_suggestions: string[];
  export_notes: string;
}

const shotItemSchema = {
  type: Type.OBJECT,
  properties: {
    t_start: { type: Type.STRING },
    t_end: { type: Type.STRING },
    visual_prompt: { type: Type.STRING },
    image_prompt: { type: Type.STRING },
    video_prompt: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    subtitle_bn: { type: Type.STRING },
    transition: { type: Type.STRING },
    music_cue: { type: Type.STRING },
  },
  propertyOrdering: [
    "t_start",
    "t_end",
    "visual_prompt",
    "image_prompt",
    "video_prompt",
    "subtitle",
    "subtitle_bn",
    "transition",
    "music_cue",
  ],
};

const localeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    voiceover: { type: Type.STRING },
  },
  propertyOrdering: ["title", "voiceover"],
};

const schema = {
  type: Type.OBJECT,
  properties: {
    aspect_ratio: { type: Type.STRING },
    platform: { type: Type.STRING },
    timeline_seconds: { type: Type.NUMBER },
    voiceover: { type: Type.STRING },
    narration_script: { type: Type.STRING },
    translations: {
      type: Type.OBJECT,
      properties: {
        en: localeSchema,
        bn: localeSchema,
      },
      propertyOrdering: ["en", "bn"],
    },
    shot_list: {
      type: Type.ARRAY,
      items: shotItemSchema,
    },
    music_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    export_notes: { type: Type.STRING },
  },
  propertyOrdering: [
    "aspect_ratio",
    "platform",
    "timeline_seconds",
    "voiceover",
    "narration_script",
    "translations",
    "shot_list",
    "music_suggestions",
    "export_notes",
  ],
};

const ORCHESTRATION_PROMPT = `You are an advanced AI orchestration engine for short-form video.

Do NOT stop at minimal JSON. Produce a COMPLETE media workflow blueprint:
1. voiceover + narration_script (full spoken script)
2. shot_list with image_prompt AND video_prompt per scene (cinematic, vertical 9:16)
3. subtitle + subtitle_bn per shot
4. translations.en and translations.bn (title + voiceover in each language)
5. transitions, music_cue, music_suggestions, export_notes

Optimize pacing for TikTok, YouTube Shorts, Instagram Reels, and Facebook Reels.`;

export async function generateVideoPlan(
  form: ScriptFormData & { topic: string }
): Promise<VideoPlanResult> {
  const ai = getGeminiClient();
  const prompt = `${ORCHESTRATION_PROMPT}

Create a vertical-first (9:16) cinematic shot plan for a ${form.duration}s ${form.platform} video.
Topic: ${form.topic}
Tone: ${form.tone}
Audience: ${form.audience}
Style: ${form.contentStyle}
Primary language: ${form.language}

shot_list must cover the full timeline with tight beats. Return JSON only.`;

  const res = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      temperature: 0.75,
    },
  });

  const raw = res.text;
  if (!raw) throw new Error("Empty Gemini response");
  const plan = JSON.parse(raw) as VideoPlanResult;

  if (!plan.shot_list?.length) {
    throw new Error("Invalid video plan: empty shot_list");
  }

  return plan;
}
