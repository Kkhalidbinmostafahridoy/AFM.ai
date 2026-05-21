import { z } from "zod";

export const generateScriptSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters").max(200),
  language: z.enum([
    "en", "es", "fr", "de", "pt", "hi", "ar", "ja", "ko", "zh",
  ]),
  tone: z.enum([
    "energetic", "professional", "humorous",
    "inspirational", "educational", "dramatic",
  ]),
  platform: z.enum([
    "youtube_shorts", "tiktok", "instagram_reels", "facebook",
  ]),
  duration: z.enum(["15", "30", "60", "90"]),
  audience: z.enum([
    "general", "gen_z", "millennials",
    "entrepreneurs", "fitness", "tech",
  ]),
  contentStyle: z.enum([
    "storytelling", "tutorial", "listicle",
    "controversy", "before_after", "day_in_life",
  ]),
});

export const updateScriptSchema = z.object({
  topic: z.string().min(1).max(200).optional(),
  hook: z.string().optional(),
  caption: z.string().optional(),
  cta: z.string().optional(),
  script_data: z.record(z.unknown()).optional(),
});

export const forgeImageSchema = z.object({
  prompt: z.string().min(8).max(2000),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "3:4", "4:3"]).optional(),
  style: z.string().max(200).optional(),
});

export const forgeVideoPlanSchema = generateScriptSchema.extend({
  renderMedia: z.boolean().optional(),
});

export const forgeAnalyzeVideoSchema = z.object({
  videoUrl: z.string().url().max(2000),
  transcript: z.string().max(16000).optional(),
  platformHint: z.string().max(120).optional(),
  renderRecap: z.boolean().optional(),
});

export const forgeTranslateSchema = z.object({
  text: z.string().min(1).max(8000),
  direction: z.enum(["bn_en", "en_bn"]),
  style: z.enum(["natural", "formal", "casual", "business"]),
});

export const transcribeAudioSchema = z.object({
  audioBase64: z.string().min(100).max(12_000_000),
  mimeType: z
    .string()
    .regex(/^audio\//, "mimeType must be an audio/* type"),
});

export const chatMessageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(12000),
      })
    )
    .min(1)
    .max(40),
  /** `auto` or `provider:model` e.g. openai:gpt-4o-mini */
  model: z.string().max(120).optional(),
  fusion: z.boolean().optional(),
  /** chat = standard; swarm/research/debate use multi-agent routes */
  chatMode: z.enum(["chat", "swarm", "research", "debate", "auto"]).optional(),
  stream: z.boolean().optional(),
});

export const swarmChatSchema = z.object({
  messages: chatMessageSchema.shape.messages,
  mode: z.enum(["single", "swarm", "auto", "debate", "research"]),
});

export const intentSchema = z.object({
  message: z.string().min(1).max(8000),
});

export const workflowRunSchema = z.object({
  workflowId: z.string().min(1).max(80),
  topic: z.string().min(3).max(500),
  platform: z.enum([
    "youtube_shorts",
    "tiktok",
    "instagram_reels",
    "facebook",
  ]).optional(),
});

export const memoryEntrySchema = z.object({
  category: z.string().min(1).max(60),
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(8000),
});
