import type { AfmUserPrefs, MemoryEntry } from "./types";
import type { PersonalityId, OperatingMode } from "./navigation";

const PREFS_KEY = "afm_user_prefs";
const MEMORY_PREFIX = "afm_memory_";

export function getDefaultPrefs(): AfmUserPrefs {
  return {
    personality: "business",
    operatingMode: "assistant",
    favoritePrompts: [],
  };
}

export function loadPrefs(): AfmUserPrefs {
  if (typeof window === "undefined") return getDefaultPrefs();
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return getDefaultPrefs();
    return { ...getDefaultPrefs(), ...JSON.parse(raw) };
  } catch {
    return getDefaultPrefs();
  }
}

export function savePrefs(prefs: Partial<AfmUserPrefs>): AfmUserPrefs {
  const next = { ...loadPrefs(), ...prefs };
  if (typeof window !== "undefined") {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }
  return next;
}

export function loadMemoryCategory(category: string): MemoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${MEMORY_PREFIX}${category}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMemoryEntry(
  category: string,
  entry: Omit<MemoryEntry, "id" | "updatedAt">
): MemoryEntry {
  const list = loadMemoryCategory(category);
  const row: MemoryEntry = {
    ...entry,
    id: `mem_${Date.now()}`,
    category,
    updatedAt: new Date().toISOString(),
  };
  const next = [row, ...list].slice(0, 100);
  if (typeof window !== "undefined") {
    localStorage.setItem(`${MEMORY_PREFIX}${category}`, JSON.stringify(next));
  }
  return row;
}

export function personalitySystemHint(
  personality: PersonalityId,
  mode: OperatingMode
): string {
  const p: Record<PersonalityId, string> = {
    creative: "Be bold, visual, and imaginative.",
    business: "Be concise, ROI-focused, and professional.",
    developer: "Be technical, precise, and code-oriented.",
    teacher: "Explain step-by-step with examples.",
    emotional: "Be warm, empathetic, and supportive.",
    autonomous: "Proactively suggest next actions and automations.",
  };
  const m: Record<OperatingMode, string> = {
    assistant: "Answer questions directly.",
    agent: "Break work into executable tasks.",
    autonomous: "Plan multi-step background work (describe only; do not claim execution).",
  };
  return `${p[personality]} ${m[mode]}`;
}
