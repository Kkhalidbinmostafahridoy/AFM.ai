import type {
  Platform,
  Tone,
  AudienceType,
  ContentStyle,
  Duration,
  Language,
} from "@/types";

export const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: "youtube_shorts", label: "YouTube Shorts", icon: "▶️" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "instagram_reels", label: "Instagram Reels", icon: "📸" },
  { value: "facebook", label: "Facebook Videos", icon: "👥" },
];

export const TONES: { value: Tone; label: string }[] = [
  { value: "energetic", label: "Energetic" },
  { value: "professional", label: "Professional" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "educational", label: "Educational" },
  { value: "dramatic", label: "Dramatic" },
];

export const AUDIENCES: { value: AudienceType; label: string }[] = [
  { value: "general", label: "General Audience" },
  { value: "gen_z", label: "Gen Z" },
  { value: "millennials", label: "Millennials" },
  { value: "entrepreneurs", label: "Entrepreneurs" },
  { value: "fitness", label: "Fitness Enthusiasts" },
  { value: "tech", label: "Tech Savvy" },
];

export const CONTENT_STYLES: { value: ContentStyle; label: string }[] = [
  { value: "storytelling", label: "Storytelling" },
  { value: "tutorial", label: "Tutorial / How-To" },
  { value: "listicle", label: "Listicle" },
  { value: "controversy", label: "Hot Take" },
  { value: "before_after", label: "Before & After" },
  { value: "day_in_life", label: "Day in the Life" },
];

export const DURATIONS: { value: Duration; label: string }[] = [
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "60 seconds" },
  { value: "90", label: "90 seconds" },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

/** Branded assistant name (set NEXT_PUBLIC_AI_ASSISTANT_NAME for UI). */
export const AFM_AI_NAME =
  process.env.NEXT_PUBLIC_AI_ASSISTANT_NAME?.trim() ||
  process.env.AI_ASSISTANT_NAME?.trim() ||
  "AFM.ai";

export const FREE_DAILY_LIMIT = 5;
export const PREMIUM_PRICE = 19;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/dashboard/generate", label: "Generate", icon: "Sparkles" },
  { href: "/dashboard/history", label: "History", icon: "History" },
  { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
];
