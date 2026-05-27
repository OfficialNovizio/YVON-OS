-- 039_agent_session_memory.sql
-- Rolling 50-session memory per agent.
-- Agents POST here during ADJOURNING; session start reads last N rows.
-- Distinct from agent_memory (static MEMORY.md content) — this is session history.

CREATE TABLE IF NOT EXISTS agent_session_memory (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         TEXT        NOT NULL,
  venture          TEXT,
  session_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  summary          TEXT        NOT NULL DEFAULT '',
  learnings        TEXT[]      NOT NULL DEFAULT '{}',
  corrections      TEXT[]      NOT NULL DEFAULT '{}',
  files_changed    TEXT[]      NOT NULL DEFAULT '{}',
  tool_calls_count INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_session_memory_agent
  ON agent_session_memory(agent_id, created_at DESC);

COMMENT ON TABLE agent_session_memory IS
  'Rolling 50-session history per agent. Written by Claude during ADJOURNING. '
  'Auto-pruned to 50 rows per agent via trigger.';

ALTER TABLE agent_session_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_session_memory_service_all ON agent_session_memory;
CREATE POLICY agent_session_memory_service_all
  ON agent_session_memory FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Prune to 50 sessions per agent after every insert
CREATE OR REPLACE FUNCTION prune_agent_session_memory()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM agent_session_memory
  WHERE agent_id = NEW.agent_id
    AND id NOT IN (
      SELECT id FROM agent_session_memory
      WHERE agent_id = NEW.agent_id
      ORDER BY created_at DESC
      LIMIT 50
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_agent_session_memory ON agent_session_memory;
CREATE TRIGGER trg_prune_agent_session_memory
  AFTER INSERT ON agent_session_memory
  FOR EACH ROW EXECUTE FUNCTION prune_agent_session_memory();
