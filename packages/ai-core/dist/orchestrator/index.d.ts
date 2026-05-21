import type { ChatTurn, OrchestratorResult } from "../types.js";
export declare function orchestrateChat(params: {
    messages: ChatTurn[];
    fusion?: boolean;
    memoryContext?: string;
}): Promise<OrchestratorResult>;
/** Stream tokens when OpenAI is primary; else chunk full reply */
export declare function streamChat(params: {
    messages: ChatTurn[];
    memoryContext?: string;
}): AsyncGenerator<{
    type: "token" | "done";
    data: string;
    meta?: OrchestratorResult;
}>;
