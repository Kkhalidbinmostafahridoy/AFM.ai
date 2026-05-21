export type Platform =
  | "youtube_shorts"
  | "tiktok"
  | "instagram_reels"
  | "facebook";

export type Tone =
  | "energetic"
  | "professional"
  | "humorous"
  | "inspirational"
  | "educational"
  | "dramatic";

export type AudienceType =
  | "general"
  | "gen_z"
  | "millennials"
  | "entrepreneurs"
  | "fitness"
  | "tech";

export type ContentStyle =
  | "storytelling"
  | "tutorial"
  | "listicle"
  | "controversy"
  | "before_after"
  | "day_in_life";

export type Duration = "15" | "30" | "60" | "90";

export type Language =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "hi"
  | "ar"
  | "ja"
  | "ko"
  | "zh";

export interface ScriptScene {
  scene: string;
  voiceover: string;
  duration: string;
  camera_angle?: string;
}

/** Three-beat cinematic spine: Hook → Story → CTA (each row is one consolidated beat). */
export interface CinematicSection {
  section: string;
  scene: string;
  voiceover: string;
  camera: string;
  subtitle: string;
  music: string;
  transition: string;
}

export interface GeneratedScript {
  hook: string;
  script: ScriptScene[];
  /** Exactly three rows preferred: Hook, Story, CTA */
  sections?: CinematicSection[];
  scene_breakdown?: string[];
  camera_angles?: string[];
  caption: string;
  hashtags: string[];
  cta: string;
  thumbnail_idea: string;
  music_suggestion: string;
  /** Per-scene prompts for vertical AI video tools */
  video_prompts?: string[];
  thumbnail_prompt?: string;
}

export interface ScriptFormData {
  topic: string;
  language: Language;
  tone: Tone;
  platform: Platform;
  duration: Duration;
  audience: AudienceType;
  contentStyle: ContentStyle;
}

export interface SavedScript extends GeneratedScript {
  id: string;
  user_id: string;
  topic: string;
  platform: Platform;
  language: Language;
  tone: Tone;
  created_at: string;
  updated_at: string;
}

export type PlanType = "free" | "premium";

export interface UserCredits {
  user_id: string;
  plan: PlanType;
  generations_today: number;
  last_reset_date: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanType;
  status: string;
  current_period_end: string | null;
}
