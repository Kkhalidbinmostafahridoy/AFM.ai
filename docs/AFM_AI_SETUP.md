# AFM.ai setup guide

AFM.ai is the multi-model assistant layer in this project. It routes questions across configured providers and formats every reply with **Final Answer**, **Explanation**, **Extra Improvements**, and **References**.

## 1. Copy environment file

```bash
cp .env.example .env.local
```

Never commit `.env.local`. If API keys were pasted in chat or email, **rotate them** in each provider dashboard.

## 2. Required keys (minimum)

| Variable | Provider | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Must be a Google key (`AIza…`). Powers scripts, images, video analysis, TTS, **voice transcription** |
| Clerk + Supabase | As in `.env.example` | Auth and data |

## 3. Optional multi-model chat keys

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) — `sk-proj-…` or `sk-…` |
| `DEEPSEEK_API_KEY` | [DeepSeek](https://platform.deepseek.com) |
| `XAI_API_KEY` or `GROK_API_KEY` | [xAI Console](https://console.x.ai) |
| `OPENCODE_API_KEY` + `OPENCODE_BASE_URL` | Your OpenAI-compatible server |
| `CLOUD_AI_API_KEY` + `CLOUD_AI_BASE_URL` | Generic compatible endpoint |

## 4. Model names (common mistakes)

| Variable | Correct example | Wrong example |
|----------|-----------------|---------------|
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash-lite` | `gpt-4o-2024-08-06` |
| `OPENAI_MODEL` | `gpt-4o-mini` | `gemini-2.5-flash` |
| `GEMINI_API_KEY` | Google AI Studio key | OpenAI `sk-…` key |

## 5. Feature → API map

| Feature | Dashboard path | API / lib |
|---------|----------------|-----------|
| Multi-model chat | `/dashboard/chat` | `POST /api/chat` — `lib/ai/orchestrator.ts` |
| Voice message → text | Chat mic button | `POST /api/chat/transcribe` — Gemini |
| Text → image | `/dashboard/forge/images` | `POST /api/forge/image` — Imagen |
| Image → image edit | `/dashboard/forge/image-edit` | `POST /api/forge/image-edit` |
| Video script / shot plan | `/dashboard/forge/video` | `POST /api/forge/video-plan` |
| Video URL → analysis / recap | `/dashboard/forge/analyze` | `POST /api/forge/analyze-video` |
| Dubbing / translation | `/dashboard/forge/translate` | `POST /api/forge/translate` |
| Narration TTS | Pipeline / generate | `lib/gemini/generate-tts.ts` |

## 6. Routing rules (Auto mode)

| Task type | Priority providers |
|-----------|-------------------|
| Coding | DeepSeek → OpenAI → … |
| Creative | Grok → OpenAI → … |
| Image / video / vision | Gemini → OpenAI → … |
| General | OpenAI → Gemini → … |

Enable **Multi-model fusion** in chat when two or more providers are configured (`CHAT_ENABLE_FUSION=1` default).

## 7. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/dashboard/chat](http://localhost:3000/dashboard/chat).

## 8. References

- [Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [OpenAI API](https://platform.openai.com/docs)
- [DeepSeek API](https://api-docs.deepseek.com/)
- [xAI API](https://docs.x.ai/)
- Project pipeline: `docs/VIRALFORGE_PIPELINE.md`
