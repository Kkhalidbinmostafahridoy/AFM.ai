# AFM.ai Backend Architecture

## Monorepo layout

```txt
apps/
  web/          → Next.js (repo root: app/, components/)
  server/       → Express API + WebSocket monitor (@afm/server)
  workers/      → Background jobs placeholder (BullMQ Phase 2)
packages/
  ai-core/      → Orchestration engine + providers
  db/           → Prisma + PostgreSQL
```

## Request flow (required)

```txt
Browser → Next.js /api/* (gateway) → apps/server → @afm/ai-core → Provider APIs
```

Never call `openai.com` or `generativelanguage.googleapis.com` from React components.

## Start development

```bash
npm install
npm run db:generate
npm run db:push          # requires DATABASE_URL
npm run dev              # web :3000 + server :4000
```

## AI Core (`packages/ai-core`)

| Step | Module |
|------|--------|
| Intent | `orchestrator/router.ts` → `classifyTask()` |
| Route | `pickProviderChain()` with fallbacks |
| Execute | `providers/*` parallel or chain |
| Merge | Fusion mode in `orchestrator/index.ts` |
| Stream | `streamChat()` SSE via OpenAI stream |

### Routing (example)

| Task | Primary | Fallback chain |
|------|---------|----------------|
| coding | Claude | OpenAI → DeepSeek |
| research | Gemini | Grok → OpenAI |
| creative | OpenAI | Claude → Grok |
| reasoning | DeepSeek | OpenAI → Claude |

## Server endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | DB + provider health |
| GET | `/v1/providers` | Model list + health |
| POST | `/v1/chat` | Orchestrated chat |
| POST | `/v1/chat/stream` | SSE streaming |
| WS | `/v1/ws/monitor` | Live health push |

## Database (Prisma)

Tables: `afm_users`, `afm_conversations`, `afm_messages`, `afm_memory`, `afm_workflow_runs`

Set in `.env.local`:

```env
DATABASE_URL=postgresql://AFM.ai:YOUR_PASSWORD@localhost:5432/afm_ai
```

## Phase status

| Module | Backend | Live |
|--------|---------|------|
| AI Chat | server + stream | Yes |
| Scripts | Next forge APIs | Yes |
| Image/Video/Translate/Analyze | Gemini routes | Yes |
| AI Swarm | `/api/afm/swarm` | Yes |
| Memory | Prisma when DB up | Partial |
| Workflows | `/api/afm/workflow` | Partial |
| Research/Agents/3D/Builders | Phase 2–3 | Scaffold |

## Next: Redis + BullMQ

Heavy video render → `apps/workers` queue, not API route timeout.
