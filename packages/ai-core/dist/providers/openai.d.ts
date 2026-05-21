import type { AIProviderAdapter } from "../types";
export declare const openaiProvider: AIProviderAdapter;
export declare function streamOpenAI(params: Parameters<AIProviderAdapter["chat"]>[0]): AsyncGenerator<string, any, any>;
