-- Migration 010: Hermes Memory System
-- Adds agent session memory, Kahneman strategy tracking, lever tracker,
-- and brand psychology notes with PostgreSQL FTS.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Agent Sessions ───────────────────────────────────────────────────────────
-- Every agent session (War Room or direct) is recorded here for cross-session recall.

CREATE TABLE IF NOT EXISTS agent_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        TEXT NOT NULL,                        -- AgentId string
  venture         TEXT NOT NULL,
  task            TEXT NOT NULL,                        -- what was asked
  outcome         TEXT NOT NULL,                        -- what was delivered (summary)
  system_target   TEXT CHECK (system_target IN ('system1','system2','mixed')),
  tokens_used     INTEGER,
  duration_ms     INTEGER,
  session_search  TSVECTOR,                             -- full-text search column
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for FTS on session content
CREATE INDEX IF NOT EXISTS idx_agent_sessions_search   ON agent_sessions USING GIN(session_search);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_venture  ON agent_sessions(venture);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created  ON agent_sessions(created_at DESC);

-- Auto-populate tsvector from task + outcome on insert/update
CREATE OR REPLACE FUNCTION agent_sessions_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.session_search :=
    setweight(to_tsvector('english', coalesce(NEW.task,    '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.outcome, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_sessions_search_trigger ON agent_sessions;
CREATE TRIGGER agent_sessions_search_trigger
  BEFORE INSERT OR UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION agent_sessions_search_update();

-- ─── Strategy Log ─────────────────────────────────────────────────────────────
-- Kahneman strategy records — one per skill session.

CREATE TABLE IF NOT EXISTS strategy_log (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand                TEXT NOT NULL,
  surface              TEXT NOT NULL,            -- 'instagram' | 'website' | 'email' | 'ads' etc.
  lever                TEXT NOT NULL,            -- primary psychological lever name
  layer_number         INTEGER NOT NULL,         -- L1–L8
  variant_a            TEXT NOT NULL,            -- content of variant A
  variant_b            TEXT NOT NULL,            -- content of variant B
  run_recommendation   TEXT CHECK (run_recommendation IN ('A','B')),
  result               TEXT,                     -- NULL = PENDING; filled when data comes in
  diagnosis            TEXT,                     -- why it worked/failed at mechanism level
  mechanism_confirmed  BOOLEAN,                  -- true = lever hypothesis confirmed
  next_cycle_direction TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_log_brand   ON strategy_log(brand);
CREATE INDEX IF NOT EXISTS idx_strategy_log_surface ON strategy_log(brand, surface);
CREATE INDEX IF NOT EXISTS idx_strategy_log_lever   ON strategy_log(lever);
CREATE INDEX IF NOT EXISTS idx_strategy_log_pending ON strategy_log(result) WHERE result IS NULL;

-- ─── Lever Tracker ────────────────────────────────────────────────────────────
-- Triple Cap enforcement: tracks consecutive primary lever usage per brand + surface.

CREATE TABLE IF NOT EXISTS lever_tracker (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand        TEXT NOT NULL,
  surface      TEXT NOT NULL,
  lever        TEXT NOT NULL,
  usage_count  INTEGER NOT NULL DEFAULT 1 CHECK (usage_count BETWEEN 1 AND 3),
  capped       BOOLEAN NOT NULL DEFAULT FALSE,
  last_used    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand, surface)   -- one active lever row per brand+surface; updated on each use
);

CREATE INDEX IF NOT EXISTS idx_lever_tracker_brand ON lever_tracker(brand, surface);

-- ─── Brand Psychology ─────────────────────────────────────────────────────────
-- Structured notes about brand audience psychology — auto-appended by Kahneman each session.

CREATE TABLE IF NOT EXISTS brand_psychology (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand      TEXT NOT NULL,
  surface    TEXT,                -- NULL = brand-wide note
  category   TEXT NOT NULL CHECK (category IN ('audience','lever','archetype','tone','timing','general')),
  note       TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high','medium','low')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_psychology_brand    ON brand_psychology(brand);
CREATE INDEX IF NOT EXISTS idx_brand_psychology_category ON brand_psychology(brand, category);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Service role bypasses RLS — all access via server-side lib/db.ts with SUPABASE_SERVICE_ROLE_KEY

ALTER TABLE agent_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lever_tracker    ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_psychology ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_sessions_service_all   ON agent_sessions   USING (true) WITH CHECK (true);
CREATE POLICY strategy_log_service_all     ON strategy_log     USING (true) WITH CHECK (true);
CREATE POLICY lever_tracker_service_all    ON lever_tracker    USING (true) WITH CHECK (true);
CREATE POLICY brand_psychology_service_all ON brand_psychology USING (true) WITH CHECK (true);

COMMENT ON TABLE agent_sessions   IS 'Hermes: cross-session agent memory with PostgreSQL FTS';
COMMENT ON TABLE strategy_log     IS 'Hermes: Kahneman strategy tracking with pending/confirmed results';
COMMENT ON TABLE lever_tracker    IS 'Hermes: Triple Cap enforcement — consecutive lever usage per brand+surface';
COMMENT ON TABLE brand_psychology IS 'Hermes: auto-appended brand psychology notes from Kahneman sessions';
