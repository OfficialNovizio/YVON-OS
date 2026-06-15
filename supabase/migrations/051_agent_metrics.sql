-- 051_agent_metrics.sql — Real-time agent metrics pipeline
-- Stores Hermes token usage, TOON stats, provider health, and agent activity
-- Written by Hermes cron job, read by YVON dashboard API routes

-- Token usage per agent per day
CREATE TABLE IF NOT EXISTS agent_token_usage (
  id            BIGSERIAL PRIMARY KEY,
  agent_id      TEXT NOT NULL,
  agent_name    TEXT NOT NULL,
  department    TEXT NOT NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  tokens        BIGINT NOT NULL DEFAULT 0,
  cost          NUMERIC(10,6) NOT NULL DEFAULT 0,
  provider      TEXT NOT NULL DEFAULT 'deepseek',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, date, provider)
);

-- Provider health snapshot (latest only)
CREATE TABLE IF NOT EXISTS provider_health (
  id            BIGSERIAL PRIMARY KEY,
  provider      TEXT NOT NULL UNIQUE,
  usage_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  balance       NUMERIC(10,2),
  configured    BOOLEAN NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TOON compression stats snapshot
CREATE TABLE IF NOT EXISTS toon_stats (
  id                BIGSERIAL PRIMARY KEY,
  category          TEXT NOT NULL UNIQUE,   -- e.g. 'documents', 'code', 'memory', 'schemas', 'configs', 'scripts', 'graphs'
  compression_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  grade             TEXT NOT NULL DEFAULT '—',
  last_compile      TEXT,
  compile_duration  TEXT,
  files_scanned     INTEGER DEFAULT 0,
  chunks_built      INTEGER DEFAULT 0,
  terms_indexed     INTEGER DEFAULT 0,
  bpe_tokens        INTEGER DEFAULT 0,
  corpus_size       TEXT,
  compressed_size   TEXT,
  ts_errors         INTEGER DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent activity feed (Hermes session log)
CREATE TABLE IF NOT EXISTS agent_activity (
  id            BIGSERIAL PRIMARY KEY,
  agent_name    TEXT NOT NULL,
  task          TEXT NOT NULL,
  tokens        BIGINT NOT NULL DEFAULT 0,
  duration_sec  NUMERIC(8,2),
  status        TEXT NOT NULL DEFAULT 'completed',  -- completed | error | running
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON agent_token_usage(date DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_agent ON agent_token_usage(agent_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON agent_activity(created_at DESC);
