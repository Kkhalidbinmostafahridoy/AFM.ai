import { getConfiguredProviders } from "../providers/registry.js";
const ROUTING = {
    coding: ["anthropic", "openai", "deepseek", "gemini"],
    reasoning: ["deepseek", "openai", "anthropic", "gemini"],
    creative: ["openai", "anthropic", "grok", "gemini"],
    research: ["gemini", "grok", "openai"],
    multimodal: ["gemini", "openai"],
    realtime: ["grok", "openai", "gemini"],
    education: ["openai", "gemini", "anthropic"],
    fast: ["openai", "gemini", "deepseek"],
    general: ["openai", "gemini", "anthropic", "deepseek", "grok"],
};
export function classifyTask(text) {
    const t = text.toLowerCase();
    if (/\b(code|react|api|debug|typescript|python)\b/.test(t) || /```/.test(text))
        return "coding";
    if (/\b(research|cite|source|paper|study|analyze market)\b/.test(t))
        return "research";
    if (/\b(prove|math|logic|reason|calculate)\b/.test(t))
        return "reasoning";
    if (/\b(story|poem|creative|marketing|campaign)\b/.test(t))
        return "creative";
    if (/\b(image|video|photo)\b/.test(t))
        return "multimodal";
    if (/\b(trend|news|twitter|x\.com)\b/.test(t))
        return "realtime";
    return "general";
}
export function pickProviderChain(task) {
    const configured = new Set(getConfiguredProviders().map((p) => p.id));
    const chain = ROUTING[task].filter((id) => configured.has(id));
    return chain.length ? chain : getConfiguredProviders().map((p) => p.id);
}
