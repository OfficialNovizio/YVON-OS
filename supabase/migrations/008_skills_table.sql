-- Migration 008: Skills table
-- Creates a table to store all agent skills for the YVON system
-- Skills can be loaded on-demand by agents based on their Load Triggers

CREATE TABLE IF NOT EXISTS skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'custom', -- 'anthropics', 'vercel-labs', 'supabase', 'coreyhaines31', 'deanpeters', 'composio', 'custom'
  mode text NOT NULL DEFAULT 'custom',    -- 'as-is', 'adapted', 'custom'
  assigned_agents text[] DEFAULT '{}',      -- array of agent IDs that use this skill
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast category lookups
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- Index for agent assignment lookups
CREATE INDEX IF NOT EXISTS idx_skills_agents ON skills USING GIN(assigned_agents);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Everyone can read skills
CREATE POLICY skills_read ON skills
  FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete skills (admin only)
CREATE POLICY skills_insert ON skills
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY skills_update ON skills
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY skills_delete ON skills
  FOR DELETE USING (auth.role() = 'authenticated');

COMMENT ON TABLE skills IS 'Agent skill definitions — loaded on-demand by agents based on Load Triggers';
