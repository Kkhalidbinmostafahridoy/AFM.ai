import type { ScriptFormData } from "@/types";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  hi: "Hindi",
  ar: "Arabic",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
};

const PLATFORM_NAMES: Record<string, string> = {
  youtube_shorts: "YouTube Shorts",
  tiktok: "TikTok",
  instagram_reels: "Instagram Reels",
  facebook: "Facebook Videos",
};

/**
 * Advanced prompt engineering for viral short-form video scripts
 */
export function buildScriptPrompt(data: ScriptFormData): string {
  const language = LANGUAGE_NAMES[data.language] || "English";
  const platform = PLATFORM_NAMES[data.platform] || data.platform;

  return `You are a world-class viral short video content creator with 10M+ followers across ${platform}.

Generate a highly engaging and emotionally triggering short-form video script.

## Video Requirements
- Topic: ${data.topic}
- Platform: ${platform}
- Duration: ${data.duration} seconds
- Language: ${language} (write ALL content in this language)
- Tone: ${data.tone}
- Target Audience: ${data.audience}
- Content Style: ${data.contentStyle}

## Script Requirements
- Start with a strong viral hook (first 3 seconds must stop the scroll)
- Use curiosity gap pattern and open loops
- Short punchy sentences optimized for ${data.duration}s video
- Add detailed scene directions with timing
- Include emotional triggers (fear, desire, FOMO, surprise, relatability)
- Platform-specific optimization for ${platform}
- Strong CTA at the end
- SEO-optimized caption for the platform
- 8-12 trending hashtags relevant to topic and platform
- Creative thumbnail concept
- Background music suggestion (genre, mood, tempo)

## Cinematic 3-section system (mandatory)
You MUST include "sections" as an array of **exactly 3 objects** in this order:
1) section label **Hook** — attention-grabbing opening
2) section label **Story** — emotional or informative core
3) section label **CTA** — viral payoff + strong close

Each sections[] item uses keys:
section, scene, voiceover, camera, subtitle, music, transition

## Output Format
Return ONLY valid JSON (no markdown fences) with this structure:
{
  "hook": "The viral opening hook line",
  "script": [
    {
      "scene": "Scene 1 description with visual direction",
      "voiceover": "Exact words to say",
      "duration": "0-3s",
      "camera_angle": "Close-up / POV / etc"
    }
  ],
  "sections": [
    {
      "section": "Hook",
      "scene": "What we see in the hook beat",
      "voiceover": "Words spoken",
      "camera": "Shot type / movement",
      "subtitle": "On-screen text",
      "music": "Mood / genre / tempo",
      "transition": "Cut style into next section"
    },
    {
      "section": "Story",
      "scene": "...",
      "voiceover": "...",
      "camera": "...",
      "subtitle": "...",
      "music": "...",
      "transition": "..."
    },
    {
      "section": "CTA",
      "scene": "...",
      "voiceover": "...",
      "camera": "...",
      "subtitle": "...",
      "music": "...",
      "transition": "..."
    }
  ],
  "scene_breakdown": ["Brief scene 1 summary", "Brief scene 2 summary"],
  "camera_angles": ["Angle for scene 1", "Angle for scene 2"],
  "caption": "Platform-optimized caption with emojis",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "Call to action text",
  "thumbnail_idea": "Detailed thumbnail concept",
  "thumbnail_prompt": "Image generation prompt for thumbnail (English, highly visual)",
  "video_prompts": ["Prompt for scene 1 vertical AI video", "Prompt for scene 2 ..."],
  "music_suggestion": "Music style, mood, and example tracks"
}`;
}
