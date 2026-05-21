import type { ChatTurn } from "../types.js";
export declare function chatOpenAICompatible(config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    providerLabel: string;
}, params: {
    messages: ChatTurn[];
    systemInstruction: string;
    temperature?: number;
}): Promise<{
    content: string;
    model: string;
}>;
export declare function streamOpenAICompatible(config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    providerLabel: string;
}, params: {
    messages: ChatTurn[];
    systemInstruction: string;
    temperature?: number;
}): AsyncGenerator<string>;
