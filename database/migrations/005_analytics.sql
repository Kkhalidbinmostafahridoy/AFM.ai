-- AFM.ai Enterprise Analytics Schema
-- Optimized for high-volume event ingestion and time-series queries

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  tab_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_duration_ms INT NOT NULL DEFAULT 0,
  active_ms INT NOT NULL DEFAULT 0,
  idle_ms INT NOT NULL DEFAULT 0,
  ai_interaction_ms INT NOT NULL DEFAULT 0,
  page_view_ms INT NOT NULL DEFAULT 0,
  workflow_ms INT NOT NULL DEFAULT 0,
  websocket_ms INT NOT NULL DEFAULT 0,
  workspace_ms INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started ON analytics_sessions(started_at);

CREATE TABLE IF NOT EXISTS analytics_user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  path TEXT,
  duration_ms INT,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_activity_session ON analytics_user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_activity_type ON analytics_user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_activity_created ON analytics_user_activity(created_at);

CREATE TABLE IF NOT EXISTS analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  title TEXT,
  duration_ms INT NOT NULL DEFAULT 0,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exited_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_path ON analytics_page_views(path);

CREATE TABLE IF NOT EXISTS analytics_ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  session_id UUID,
  provider TEXT,
  model TEXT,
  task_type TEXT,
  request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_at TIMESTAMPTZ,
  latency_ms INT,
  streaming_ms INT,
  tokens_in INT,
  tokens_out INT,
  status TEXT NOT NULL DEFAULT 'pending',
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  orchestration_ms INT
);
CREATE INDEX IF NOT EXISTS idx_analytics_ai_user ON analytics_ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_ai_provider ON analytics_ai_requests(provider);

CREATE TABLE IF NOT EXISTS analytics_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  step_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  tools_used INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS analytics_video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  queue_wait_ms INT,
  gpu_seconds DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS analytics_image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES afm_users(id) ON DELETE SET NULL,
  session_id UUID,
  event_type TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

CREATE TABLE IF NOT EXISTS analytics_system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  tags JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_system_key ON analytics_system_metrics(metric_key);
