# AFM.ai Enterprise Analytics

Enterprise-grade telemetry: user activity, AI orchestration, media pipelines, and productivity scoring.

## Architecture

```txt
Browser (AnalyticsProvider + hooks)
  → batched POST /api/analytics/ingest (rate-limited, GDPR consent)
  → PostgreSQL (Prisma) + optional Redis queue
  → apps/workers analytics rollup
  → WebSocket /v1/ws/analytics (live dashboard)
```

## Packages

| Path | Role |
|------|------|
| `packages/analytics` | Event types, privacy sanitization, productivity engine, aggregation |
| `lib/analytics/client.ts` | Browser SDK: heartbeat, idle, multi-tab sync |
| `components/analytics/` | Provider, dashboard, charts |
| `app/api/analytics/` | Ingest, metrics, session APIs |

## Database

Run migration:

```bash
npm run db:push
# or apply database/migrations/005_analytics.sql
```

Tables: `analytics_sessions`, `analytics_user_activity`, `analytics_page_views`, `analytics_ai_requests`, `analytics_workflow_runs`, `analytics_agent_executions`, `analytics_video_jobs`, `analytics_image_jobs`, `analytics_events`, `analytics_system_metrics`.

## Environment

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://127.0.0.1:6379   # optional pub/sub + queue
NEXT_PUBLIC_AFM_WS_URL=ws://127.0.0.1:4000
ANALYTICS_ENCRYPTION_KEY=          # optional at-rest encryption
```

## Frontend hooks

- `useAnalytics()` — generic track + consent
- `useTrackAI()` — AI request/response/stream timing
- `useTrackWorkflow()` — workflow start/complete

## Dashboard

- `/dashboard/analytics` — full enterprise dashboard
- `/dashboard/admin` — admin view with same metrics

## Privacy

- Consent banner before tracking
- `sanitizeEventProperties()` strips prompts, tokens, PII
- Rate limit: 30 events/min per user (see `lib/rate-limit.ts`)

## Session replay (Phase 2)

See `docs/SESSION_REPLAY.md` for rrweb-based replay architecture.
