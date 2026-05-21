import { Type } from "@google/genai";
import { getGeminiClient } from "./client";
import { GEMINI_TEXT_MODEL } from "./models";

export interface RecapScene {
  visual_prompt: string;
  image_prompt?: string;
  video_prompt?: string;
  subtitle: string;
  subtitle_bn?: string;
}

export interface VideoAnalysisResult {
  hook_style: string;
  script_structure: string;
  viral_pattern: string;
  emotion_type: string;
  engagement_strategy: string;
  cta_method: string;
  subtitle_pattern: string;
  scene_timing_notes: string;
  retention_strategy: string;
  viral_score: string;
  improvement_suggestions: string[];
  rewritten_script_outline: string;
  similar_content_ideas: string[];
  recap_title: string;
  recap_summary: string;
  narration_script: string;
  recap_scenes: RecapScene[];
}

const recapSceneSchema = {
  type: Type.OBJECT,
  properties: {
    visual_prompt: { type: Type.STRING },
    image_prompt: { type: Type.STRING },
    video_prompt: { type: Type.STRING },
    subtitle: { type: Type.STRING },
    subtitle_bn: { type: Type.STRING },
  },
  propertyOrdering: [
    "visual_prompt",
    "image_prompt",
    "video_prompt",
    "subtitle",
    "subtitle_bn",
  ],
};

const schema = {
  type: Type.OBJECT,
  properties: {
    hook_style: { type: Type.STRING },
    script_structure: { type: Type.STRING },
    viral_pattern: { type: Type.STRING },
    emotion_type: { type: Type.STRING },
    engagement_strategy: { type: Type.STRING },
    cta_method: { type: Type.STRING },
    subtitle_pattern: { type: Type.STRING },
    scene_timing_notes: { type: Type.STRING },
    retention_strategy: { type: Type.STRING },
    viral_score: { type: Type.STRING },
    improvement_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    rewritten_script_outline: { type: Type.STRING },
    similar_content_ideas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recap_title: { type: Type.STRING },
    recap_summary: { type: Type.STRING },
    narration_script: { type: Type.STRING },
    recap_scenes: {
      type: Type.ARRAY,
      items: recapSceneSchema,
    },
  },
  propertyOrdering: [
    "hook_style",
    "script_structure",
    "viral_pattern",
    "emotion_type",
    "engagement_strategy",
    "cta_method",
    "subtitle_pattern",
    "scene_timing_notes",
    "retention_strategy",
    "viral_score",
    "improvement_suggestions",
    "rewritten_script_outline",
    "similar_content_ideas",
    "recap_title",
    "recap_summary",
    "narration_script",
    "recap_scenes",
  ],
};

export async function analyzeVideoWithGemini(input: {
  videoUrl: string;
  transcript?: string;
  platformHint?: string;
}): Promise<VideoAnalysisResult> {
  const ai = getGeminiClient();

  const context = [
    `Video URL: ${input.videoUrl}`,
    input.platformHint ? `Detected / stated platform: ${input.platformHint}` : "",
    input.transcript
      ? `Transcript / captions (primary signal):\n${input.transcript.slice(0, 12000)}`
      : "No transcript provided — infer likely patterns from URL and platform norms, and state clearly where you are inferring vs. grounded in transcript.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = `You are ViralForge AI video intelligence. ${context}

Produce:
1. A rigorous creator-style teardown (hook, structure, viral pattern, retention, CTA, etc.)
2. recap_title, recap_summary, narration_script for a 30–45s AI recap short
3. recap_scenes: 3–5 vertical scenes with visual_prompt, image_prompt, video_prompt, subtitle, subtitle_bn

Users will receive a narrated recap video — not raw JSON. JSON only.`;

  const res = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      temperature: 0.6,
    },
  });

  const raw = res.text;
  if (!raw) throw new Error("Empty Gemini response");
  return JSON.parse(raw) as VideoAnalysisResult;
}
