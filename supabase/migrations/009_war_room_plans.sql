-- Migration 009: War Room Execution Plans
-- Stores every War Room execution for plan history, memory, and reference.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Execution Plans ─────────────────────────────────────────────────────────
-- One row per War Room session.

CREATE TABLE IF NOT EXISTS execution_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_name     TEXT NOT NULL,
  user_prompt      TEXT NOT NULL,
  intent           TEXT,                      -- routing intent (e.g. 'marketing_content')
  objective        TEXT,                      -- Marcus's one-sentence plan objective
  definition_done  TEXT,                      -- binary success criteria from Marcus
  agent_order      TEXT DEFAULT 'parallel',   -- 'parallel' | 'sequential'
  agents_used      TEXT[] DEFAULT '{}',       -- array of AgentId strings
  status           TEXT NOT NULL DEFAULT 'complete', -- 'complete' | 'partial' | 'error'
  synthesis        TEXT,                      -- final Marcus CEO response
  elapsed_ms       INTEGER,                   -- total wall-clock time in ms
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_plans_venture    ON execution_plans (venture_name);
CREATE INDEX IF NOT EXISTS idx_exec_plans_created_at ON execution_plans (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_plans_status     ON execution_plans (status);

-- ─── Execution Steps ─────────────────────────────────────────────────────────
-- One row per agent that ran within a plan.

CREATE TABLE IF NOT EXISTS execution_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES execution_plans(id) ON DELETE CASCADE,
  agent_id       TEXT NOT NULL,               -- AgentId string
  task_brief     TEXT,                        -- what Marcus told this agent to do
  output_content TEXT,                        -- what the agent delivered
  status         TEXT NOT NULL DEFAULT 'complete', -- 'complete' | 'error' | 'retried'
  retry_count    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_steps_plan_id  ON execution_steps (plan_id);
CREATE INDEX IF NOT EXISTS idx_exec_steps_agent_id ON execution_steps (agent_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_steps ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — all reads/writes go through server-side lib/db.ts
-- which uses SUPABASE_SERVICE_ROLE_KEY. No public access needed.

CREATE POLICY exec_plans_service_all ON execution_plans
  USING (true) WITH CHECK (true);

CREATE POLICY exec_steps_service_all ON execution_steps
  USING (true) WITH CHECK (true);

COMMENT ON TABLE execution_plans IS 'War Room execution history — one row per CEO-orchestrated session';
COMMENT ON TABLE execution_steps IS 'Per-agent step outputs within an execution plan';
