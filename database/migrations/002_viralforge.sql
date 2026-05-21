-- ViralForge AI — additional tables (run after database/schema.sql in Supabase SQL Editor)
-- Safe to re-run: policies and trigger are dropped first.

CREATE TABLE IF NOT EXISTS video_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  duration TEXT,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style TEXT,
  model TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  platform TEXT,
  transcript_excerpt TEXT,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own video projects" ON video_projects;
CREATE POLICY "Users can view own video projects" ON video_projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can insert own video projects" ON video_projects;
CREATE POLICY "Users can insert own video projects" ON video_projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can view own images" ON images;
CREATE POLICY "Users can view own images" ON images
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can insert own images" ON images;
CREATE POLICY "Users can insert own images" ON images
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can view own analyses" ON analyses;
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can insert own analyses" ON analyses;
CREATE POLICY "Users can insert own analyses" ON analyses
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP TRIGGER IF EXISTS update_video_projects_updated_at ON video_projects;
CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON video_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
