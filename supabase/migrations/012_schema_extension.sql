-- Migration 012: Schema Extension (Hermes Alignment)
-- Extends agent_sessions with token/cost tracking (aligned with Hermes sessions schema).
-- Extends skills with usage tracking and lifecycle states.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── agent_sessions: align with Hermes sessions table ────────────────────────

ALTER TABLE agent_sessions
  ADD COLUMN IF NOT EXISTS model              TEXT,
  ADD COLUMN IF NOT EXISTS input_tokens       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_read_tokens  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd           NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS billing_provider   TEXT DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS parent_session_id  UUID,
  ADD COLUMN IF NOT EXISTS lifecycle_state    TEXT DEFAULT 'active'
    CHECK (lifecycle_state IN ('active','stale','archived'));

CREATE INDEX IF NOT EXISTS idx_agent_sessions_model     ON agent_sessions(agent_id, model);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_parent    ON agent_sessions(parent_session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_lifecycle ON agent_sessions(lifecycle_state);

-- ─── skills: usage tracking + lifecycle (all agents) ─────────────────────────

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS use_count       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pinned          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lifecycle_state TEXT DEFAULT 'active'
    CHECK (lifecycle_state IN ('active','stale','archived','pinned')),
  ADD COLUMN IF NOT EXISTS related_skills  TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_skills_lifecycle  ON skills(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_skills_use_count  ON skills(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_skills_last_used  ON skills(last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_skills_related    ON skills USING GIN(related_skills);

COMMENT ON COLUMN agent_sessions.model              IS 'LLM model used (e.g. claude-haiku-4-5-20251001)';
COMMENT ON COLUMN agent_sessions.input_tokens       IS 'Prompt tokens consumed';
COMMENT ON COLUMN agent_sessions.output_tokens      IS 'Completion tokens generated';
COMMENT ON COLUMN agent_sessions.cost_usd           IS 'Estimated USD cost for this session';
COMMENT ON COLUMN agent_sessions.parent_session_id  IS 'Links compressed sub-sessions to parent War Room session';
COMMENT ON COLUMN skills.use_count                  IS 'Total times this skill was returned by /api/skills (Tier 1+2)';
COMMENT ON COLUMN skills.lifecycle_state            IS 'active|stale|archived|pinned — managed by calibration cron';
