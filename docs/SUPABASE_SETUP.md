# Supabase setup (required for script generation)

## 1. Create a project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → pick a name and password → wait until it’s ready (~2 min)

## 2. Copy API keys

1. Open your project → **Settings** (gear) → **API**
2. Copy these three values into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Field in dashboard | Variable in `.env.local` |
|--------------------|--------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (secret) | `SUPABASE_SERVICE_ROLE_KEY` |

**Do not** commit `.env.local` or share the service_role key.

## 3. Create database tables

1. In Supabase → **SQL Editor** → **New query**
2. Paste the full contents of `database/schema.sql` from this repo
3. Click **Run**
4. Paste and run `database/migrations/002_viralforge.sql` for ViralForge images, shot plans, and analyses

## 4. Google Gemini (required for all AI features)

In `.env.local`, set a real key from [Google AI Studio](https://aistudio.google.com/apikey):

```env
GEMINI_API_KEY=your_key_here
```

Optional overrides: `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`, `GEMINI_IMAGE_EDIT_MODEL` (see `.env.example`).

## 5. Restart the app

```bash
# Stop the server (Ctrl+C), then:
npm run dev
```

The yellow banner should disappear and **Generate Script** will be enabled.

## Optional: Clerk webhook (for user sync)

In Clerk Dashboard → Webhooks → add endpoint:

`https://your-domain.com/api/webhooks/clerk`

For local dev, use a tunnel (e.g. ngrok) or skip until deploy — scripts still work; user rows are created on first API use if needed.
