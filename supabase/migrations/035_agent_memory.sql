-- 035_agent_memory.sql
-- Persists per-agent rolling memory (MEMORY.md) in Supabase so it can be edited
-- from the UI and read live by War Room without filesystem dependency.
-- Replaces filesystem reads of agent-department/[Dept]/[agent]/MEMORY.md.

CREATE TABLE IF NOT EXISTS agent_memory (
  agent_id     TEXT PRIMARY KEY,
  content      TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE agent_memory IS
  'Per-agent rolling MEMORY.md content. Edited from Settings → Agents; consumed by War Room.';

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_memory_service_all ON agent_memory;
CREATE POLICY agent_memory_service_all
  ON agent_memory
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION touch_agent_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_memory_updated_at ON agent_memory;
CREATE TRIGGER trg_agent_memory_updated_at
  BEFORE UPDATE ON agent_memory
  FOR EACH ROW
  EXECUTE FUNCTION touch_agent_memory_updated_at();
