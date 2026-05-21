# Session Replay Architecture (AFM.ai)

Phase 2 extension for Datadog/PostHog-style replay without storing prompts.

## Design

1. **Capture** — rrweb snapshot + mutation buffer in worker thread (max 2 MB/session).
2. **Privacy** — mask inputs, exclude chat message bodies, blur payment fields.
3. **Upload** — chunked gzip to object storage; metadata in `analytics_events` with `replay_chunk_id`.
4. **Playback** — admin-only viewer at `/dashboard/analytics/replay/[sessionId]`.
5. **Retention** — 7-day default, configurable per tenant.

## Storage schema (planned)

```sql
CREATE TABLE analytics_replay_chunks (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES analytics_sessions(id),
  chunk_index INT,
  byte_size INT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration point

Hook into `AfmAnalyticsClient.track(SESSION_END)` to flush replay buffer when consent includes `replay: true`.
