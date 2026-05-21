import type { ProviderId, TaskCategory } from "../types.js";
export declare function classifyTask(text: string): TaskCategory;
export declare function pickProviderChain(task: TaskCategory): ProviderId[];
