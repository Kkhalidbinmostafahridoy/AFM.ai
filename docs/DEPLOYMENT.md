# Deploying AFM.ai on Vercel

The Next.js app lives at the **repository root** (`app/`, `next.config.ts`, root `package.json`).

## Vercel project settings

| Setting | Value |
|--------|--------|
| **Root Directory** | *(empty — repository root)* |
| **Framework Preset** | Next.js |
| **Node.js Version** | 20.x or 22.x |
| **Include source files outside Root Directory** | Enabled (monorepo `packages/*`, `apps/*`) |

Do **not** set Root Directory to `apps/server`, `packages/db`, or other workspaces — those `package.json` files do not include `next`, and the build will fail with “No Next.js version detected”.

## Install command (monorepo)

This repo uses npm workspaces. Vercel must install the **root** workspace (where `next` is declared), not only child workspaces.

`vercel.json` sets:

```bash
npm ci --include-workspace-root
```

Without `--include-workspace-root`, npm may install ~176 workspace-only packages and skip `next` at the root.

## Build

Vercel build (see `vercel.json`): `npm run build -w @afm/ai-core && next build`

This compiles the shared package and the Next.js app only. It does **not** build `apps/server` (the Express API is deployed separately if needed).

Local full check: `npm run build` (same as above). To compile the API server: `npm run build -w @afm/server`.

## Environment variables

Copy variables from `.env.example` into the Vercel project (Production / Preview). Required keys depend on which features you enable (Clerk, Supabase, Gemini, Stripe, etc.).
