import type { ChatTurn, ProviderId } from "@/types/chat";

export interface ProviderChatParams {
  messages: ChatTurn[];
  systemInstruction: string;
  model?: string;
  temperature?: number;
}

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
  chat(params: ProviderChatParams): Promise<ProviderChatResult>;
}
