export type TranslationDirection = "bn_en" | "en_bn";

export type TranslationStyle = "natural" | "formal" | "casual" | "business";

export interface TranslationResult {
  translated_text: string;
  source_language: string;
  target_language: string;
  style: TranslationStyle;
  notes?: string;
}

export interface SavedTranslation {
  id: string;
  user_id: string;
  direction: TranslationDirection;
  style: TranslationStyle;
  source_text: string;
  translated_text: string;
  meta?: TranslationResult;
  is_favorite: boolean;
  created_at: string;
}
