# ViralForge AI — video analysis & rendering pipeline

This document describes a **production-grade** path for FFmpeg-based ingest, separate from the default **Vercel serverless** route.

## Why not FFmpeg on Vercel?

Vercel functions have **tight CPU, memory, and duration limits** and no durable local disk for large media. FFmpeg + OCR + ASR + scene detection should run on:

- **Google Cloud Run** (container with FFmpeg + your worker code)
- **AWS Fargate / ECS**
- **Modal**, **Replicate**, or similar GPU/CPU workers
- A small **VPS** (Hetzner, Fly Machines, etc.)

## Recommended pipeline

1. **Ingest** — User uploads a file to Supabase Storage or sends a signed URL after client-side upload.
2. **Normalize** — FFmpeg transcode to H.264/AAC MP4 with known resolution & fps.
3. **Keyframes** — `ffmpeg -vf fps=1/3` (or similar) to export frames every *N* seconds.
4. **Speech** — Cloud Speech-to-Text or Whisper on a worker; store transcript JSON.
5. **OCR** — Optional: Vision API / Tesseract on key frames for burned-in captions.
6. **Scenes** — Scene-change detection (FFmpeg `select='gt(scene,0.3)'`, or PySceneDetect).
7. **LLM** — Send structured summary + transcript + optional frame captions to **Gemini** (`gemini-2.5-flash` or `gemini-2.5-pro`) for the viral teardown JSON.
8. **Persist** — Write rows into Supabase `analyses` (already modeled in this repo).

## Current app behavior (in-repo pipeline)

After Gemini returns structured JSON, the app **does not** show raw JSON by default:

1. **Task router** (`lib/pipeline/task-router.ts`) selects engines: images, narration, subtitles.
2. **Orchestrator** (`lib/pipeline/orchestrator.ts`) runs:
   - Imagen per scene (`PIPELINE_MAX_SCENES`, default 4)
   - Gemini TTS narration (`GEMINI_TTS_MODEL`, default `gemini-2.5-flash-preview-tts`)
   - Subtitle timeline from shot timestamps
3. **UI** (`components/forge/pipeline-output.tsx`, `slideshow-player.tsx`) plays a **9:16 slideshow** with burned-in subtitles and AI voice — not a JSON dump.

Pipeline output is stored in Supabase JSONB as `_pipeline` inside `plan_data` / `analysis_data`.

### Multilingual data

Video plans include `translations.en` and `translations.bn` in the same JSON document (title + voiceover). Prefer this over separate `title_en` / `title_bn` columns so SEO and reversible translation stay in sync.

Optional migration: `database/migrations/004_pipeline.sql`.

## Full MP4 export (worker)

Vercel cannot run FFmpeg for final MP4 mux. For downloadable MP4 with transitions:

- Run a **render worker** (Cloud Run / Modal) that accepts `_pipeline` assets + SRT and outputs MP4.
- Or use Gemini **Veo** (`generateVideos`) as async operations with polling — wire on a worker, not a 10s serverless route.

See `generateVideos` in `@google/genai` docs for Veo integration.
