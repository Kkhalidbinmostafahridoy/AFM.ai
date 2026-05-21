-- ViralForge AI — pipeline metadata (optional; pipeline also stored in JSONB _pipeline)
-- Safe to re-run.

ALTER TABLE video_projects
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS pipeline_status TEXT;

COMMENT ON COLUMN video_projects.plan_data IS 'Gemini plan JSON; may include _pipeline render output';
COMMENT ON COLUMN analyses.analysis_data IS 'Gemini analysis JSON; may include _pipeline recap render';
