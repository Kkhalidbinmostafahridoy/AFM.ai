import type { ProviderId, TaskCategory } from "@/types/chat";
import type { OperatingMode, PersonalityId } from "./navigation";

export type SwarmMode =
  | "single"
  | "swarm"
  | "auto"
  | "debate"
  | "research";

export type WorkspaceMode =
  | "general"
  | "code"
  | "video"
  | "marketing"
  | "design";

export interface IntentAnalysis {
  intent: string;
  workspaceMode: WorkspaceMode;
  taskCategory: TaskCategory;
  confidence: number;
  suggestedWorkflow?: string;
  subtasks: TaskRoute[];
}

export interface TaskRoute {
  task: string;
  provider: ProviderId;
  displayName: string;
  reason: string;
}

export interface SwarmAgentStatus {
  provider: ProviderId;
  displayName: string;
  status: "idle" | "thinking" | "done" | "error";
  snippet?: string;
}

export interface SwarmResult {
  reply: string;
  mode: SwarmMode;
  agents: SwarmAgentStatus[];
  taskCategory: TaskCategory;
  intent?: string;
  providersUsed: string[];
  fusionUsed: boolean;
}

export interface ThinkingStep {
  id: string;
  label: string;
  status: "pending" | "active" | "done" | "error";
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: { id: string; label: string; action: string }[];
}

export interface MemoryEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface AfmUserPrefs {
  personality: PersonalityId;
  operatingMode: OperatingMode;
  favoritePrompts: string[];
  typingStyle?: string;
  businessInterests?: string[];
}
