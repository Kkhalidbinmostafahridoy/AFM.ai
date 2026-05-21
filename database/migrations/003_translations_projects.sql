-- ViralForge AI — translations + projects (run after schema.sql and 002_viralforge.sql)
-- Safe to re-run: policies/triggers dropped first where applicable.

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL DEFAULT 'general',
  resource_id UUID,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('bn_en', 'en_bn')),
  style TEXT NOT NULL CHECK (style IN ('natural', 'formal', 'casual', 'business')),
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translations_user_id ON translations(user_id);
CREATE INDEX IF NOT EXISTS idx_translations_created_at ON translations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_translations_direction ON translations(direction);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can view own translations" ON translations;
CREATE POLICY "Users can view own translations" ON translations
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can insert own translations" ON translations;
CREATE POLICY "Users can insert own translations" ON translations
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can update own translations" ON translations;
CREATE POLICY "Users can update own translations" ON translations
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
DROP POLICY IF EXISTS "Users can delete own translations" ON translations;
CREATE POLICY "Users can delete own translations" ON translations
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
