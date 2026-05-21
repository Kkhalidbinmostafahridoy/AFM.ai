# Multi-model AI orchestrator

The **AI Chat** feature (`/dashboard/chat`) routes each message to the best **configured** provider. Providers without API keys are never called and never shown as "used".

## Supported providers

| Provider | Environment variables |
|----------|----------------------|
| Google Gemini | `GEMINI_API_KEY` |
| OpenAI | `OPENAI_API_KEY`, optional `OPENAI_MODEL`, `OPENAI_BASE_URL` |
| DeepSeek | `DEEPSEEK_API_KEY`, optional `DEEPSEEK_MODEL` |
| Grok (xAI) | `XAI_API_KEY` or `GROK_API_KEY`, optional `GROK_MODEL` |
| OpenCode | `OPENCODE_API_KEY` + `OPENCODE_BASE_URL` (OpenAI-compatible) |
| Cloud AI | `CLOUD_AI_API_KEY` + `CLOUD_AI_BASE_URL` (any OpenAI-compatible host) |

## Routing (Auto mode)

- **Coding** → OpenCode → OpenAI → DeepSeek → Gemini  
- **Reasoning** → OpenAI → DeepSeek → Gemini  
- **Creative** → OpenAI → Grok → Gemini  
- **Real-time style** → Grok → Cloud → OpenAI  
- **Education** → OpenAI → DeepSeek → Gemini  
- **Fast / short** → Cloud → Gemini → DeepSeek  

If the first provider fails (503, quota, etc.), the orchestrator **automatically tries the next** in the chain.

## Multi-model fusion

Enable **Multi-model fusion** in the UI (or set `CHAT_ENABLE_FUSION=1` with ≥2 providers). Two models answer in parallel; a synthesizer merges the best parts into one reply.

## Manual mode

Pick a specific entry like `OpenAI · gpt-4o-mini` to pin one provider/model.

## Security

All API keys are **server-only** (`.env.local`). Never expose them in the browser.
