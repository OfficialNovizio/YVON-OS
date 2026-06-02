-- 046_venture_agent_memories.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Venture-scoped agent memory system with importance-weighted retrieval.
-- Each memory entry belongs to one (venture_slug, agent_id) pair.
-- Retrieval is time-decay + importance scored: recent work always surfaces,
-- old work surfaces only when importance is high or tags match the task.
--
-- Also adds tier1_model to ai_provider_keys so Opus-tier agents can be
-- dynamically routed to the most capable model per-provider instead of
-- the hardcoded model name.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. tier1_model column on ai_provider_keys (Opus-tier agents: dev-lead, raj-backend)
ALTER TABLE ai_provider_keys
  ADD COLUMN IF NOT EXISTS tier1_model TEXT;

-- 2. venture_agent_memories table
CREATE TABLE IF NOT EXISTS venture_agent_memories (
  id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_slug      TEXT        NOT NULL,
  agent_id          TEXT        NOT NULL,
  memory_key        TEXT,                               -- optional topic slug for keyed upserts
  content           TEXT        NOT NULL,
  memory_type       TEXT        NOT NULL DEFAULT 'learned',
  -- memory_type values: 'learned' | 'correction' | 'preference' | 'context'
  importance        SMALLINT    NOT NULL DEFAULT 5,     -- 1–10; drives age-decay bypass
  tags              TEXT[]      NOT NULL DEFAULT '{}',  -- topic tags for cross-session matching
  source_session_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at  TIMESTAMPTZ,
  access_count      INTEGER     NOT NULL DEFAULT 0
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_vam_venture_agent
  ON venture_agent_memories(venture_slug, agent_id);

CREATE INDEX IF NOT EXISTS idx_vam_venture_agent_time
  ON venture_agent_memories(venture_slug, agent_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_vam_importance
  ON venture_agent_memories(venture_slug, agent_id, importance DESC);

CREATE INDEX IF NOT EXISTS idx_vam_tags
  ON venture_agent_memories USING GIN(tags);

-- 4. Row Level Security — service role bypasses all policies
ALTER TABLE venture_agent_memories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'venture_agent_memories'
      AND policyname = 'Service role full access on venture_agent_memories'
  ) THEN
    CREATE POLICY "Service role full access on venture_agent_memories"
      ON venture_agent_memories
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 5. Auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION update_vam_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vam_updated_at ON venture_agent_memories;
CREATE TRIGGER trg_vam_updated_at
  BEFORE UPDATE ON venture_agent_memories
  FOR EACH ROW EXECUTE FUNCTION update_vam_updated_at();

-- 6. Auto-cap: keep max 50 memories per (venture_slug, agent_id).
-- When inserting a 51st row, delete the oldest + least important entries beyond cap.
-- This keeps the table bounded without a cron job.
CREATE OR REPLACE FUNCTION enforce_vam_cap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM venture_agent_memories
  WHERE id IN (
    SELECT id FROM venture_agent_memories
    WHERE venture_slug = NEW.venture_slug
      AND agent_id     = NEW.agent_id
    ORDER BY importance ASC, updated_at ASC
    OFFSET 50
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vam_cap ON venture_agent_memories;
CREATE TRIGGER trg_vam_cap
  AFTER INSERT ON venture_agent_memories
  FOR EACH ROW EXECUTE FUNCTION enforce_vam_cap();
