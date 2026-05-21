export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export type ProviderId =
  | "gemini"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "grok"
  | "opencode"
  | "cloud";

export type TaskCategory =
  | "coding"
  | "reasoning"
  | "creative"
  | "multimodal"
  | "realtime"
  | "education"
  | "fast"
  | "general";

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  configured: boolean;
  models: { id: string; label: string }[];
}

export interface OrchestratorChatResult {
  reply: string;
  modelStrategy: string;
  providersUsed: string[];
  taskCategory: TaskCategory;
  fusionUsed: boolean;
}
