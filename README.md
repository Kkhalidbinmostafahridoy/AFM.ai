# ViralForge AI

Gemini-native AI content studio: viral short-form **scripts** (with a 3-beat cinematic spine), **Imagen** stills, **image→image** edits, **vertical shot plans**, and **video link analysis** (transcript-grounded). Built for YouTube Shorts, TikTok, Instagram Reels, and Facebook.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + ShadCN UI
- **Framer Motion**
- **Google Gemini API** (`@google/genai`) — text, JSON, Imagen, edits
- **Supabase** (PostgreSQL)
- **Clerk** (Authentication)
- **Stripe** (Subscriptions)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PREMIUM_PRICE_ID` | Stripe price ID for premium plan |

### 3. Database setup

In Supabase **SQL Editor**, run in order:

1. `database/schema.sql`
2. `database/migrations/002_viralforge.sql` (images, `video_projects`, `analyses`)

### 4. Clerk setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Google OAuth in Clerk dashboard
3. Add webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to: `user.created`, `user.updated`, `user.deleted`

### 5. Stripe setup

1. Create a product with monthly recurring price ($19/mo)
2. Copy the Price ID to `STRIPE_PREMIUM_PRICE_ID`
3. Add webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Subscribe to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 6. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                  # App Router pages & API routes (`/api/generate`, `/api/forge/*`)
components/           # UI, landing, dashboard, forge forms
lib/gemini/           # Gemini client, script, image, video-plan, analysis
lib/                  # Supabase, Stripe, credits, validations
hooks/                # Custom React hooks
types/                # TypeScript definitions
database/             # SQL schema + migrations
prompts/              # Prompt templates
docs/                 # SUPABASE_SETUP, VIRALFORGE_DEPLOYMENT, VIRALFORGE_PIPELINE
```

## Features

- Viral scripts via Gemini JSON (hook, scenes, caption, hashtags, **3-section spine**)
- AI image generation (Imagen) + image→image edits
- Cinematic **shot plans** (timeline + prompts, 9:16-first)
- **Video analysis** from URL + optional transcript (full FFmpeg pipeline documented for workers)
- Multi-platform + 10+ languages
- History, PDF/JSON export, credits, Stripe premium
- Dark/light mode, responsive dashboard

See **docs/VIRALFORGE_DEPLOYMENT.md** and **docs/VIRALFORGE_PIPELINE.md**.

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables (including `GEMINI_API_KEY`)
4. Deploy on **Node 20+**

## License

MIT
