export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export type ProviderId =
  | "openai"
  | "gemini"
  | "deepseek"
  | "grok"
  | "anthropic"
  | "opencode"
  | "cloud";

export type TaskCategory =
  | "coding"
  | "reasoning"
  | "creative"
  | "research"
  | "multimodal"
  | "realtime"
  | "education"
  | "fast"
  | "general";

export interface ProviderChatResult {
  content: string;
  model: string;
  provider: ProviderId;
}

export interface AIProviderAdapter {
  id: ProviderId;
  label: string;
  isConfigured(): boolean;
  defaultModel(): string;
  listModels(): { id: string; label: string }[];
  chat(params: {
    messages: ChatTurn[];
    systemInstruction: string;
    model?: string;
    temperature?: number;
  }): Promise<ProviderChatResult>;
}

export interface OrchestratorResult {
  reply: string;
  taskCategory: TaskCategory;
  providersUsed: string[];
  fusionUsed: boolean;
  modelStrategy: string;
}

export type ProviderHealthStatus =
  | "online"
  | "configured"
  | "missing"
  | "error";

export interface ProviderHealth {
  id: ProviderId;
  label: string;
  status: ProviderHealthStatus;
  model: string;
  message?: string;
}
