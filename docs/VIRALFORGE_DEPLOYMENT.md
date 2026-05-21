# ViralForge AI — deployment (Vercel)

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `GEMINI_API_KEY` | **Yes** | From [Google AI Studio](https://aistudio.google.com/apikey). Server only. |
| `GEMINI_TEXT_MODEL` | No | Default `gemini-2.5-flash`. |
| `GEMINI_IMAGE_MODEL` | No | Default `imagen-4.0-generate-001` (Imagen via Gemini API). |
| `GEMINI_IMAGE_EDIT_MODEL` | No | Default `imagen-3.0-capability-001`. |
| Clerk keys | **Yes** | As in `.env.example`. |
| Supabase URL + service role | **Yes** | Run `database/schema.sql` then `database/migrations/002_viralforge.sql`. |

## Vercel

1. Connect the Git repo to Vercel.
2. Set all env vars in **Project → Settings → Environment Variables**.
3. Deploy. Use Node **20+** (matches `@google/genai`).

## Imagen / billing

Image generation uses Google **Imagen** models exposed through the Gemini API. Ensure the Google Cloud / AI Studio project has billing and model access enabled if requests fail with quota or permission errors.

## Credits

Free-tier daily limits are enforced in Supabase (`credits` table). Usage is incremented **only after** a successful generation (script save, image row, etc.).
