import type { AIProviderAdapter, ProviderId } from "../types.js";
export declare const ALL_PROVIDERS: AIProviderAdapter[];
export declare function getProvider(id: ProviderId): AIProviderAdapter | undefined;
export declare function getConfiguredProviders(): AIProviderAdapter[];
