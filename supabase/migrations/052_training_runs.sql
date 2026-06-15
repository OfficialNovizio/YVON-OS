-- 052_training_runs.sql — Skill Workshop training history
-- Stores every training iteration so agents can see improvement over time.
-- Used by /api/skill-workshop and /api/skill-workshop/train

CREATE TABLE IF NOT EXISTS training_runs (
  id SERIAL PRIMARY KEY,
  workshop_id TEXT NOT NULL,           -- e.g., 'william', 'leonardo', 'isaac', 'nexus', 'lena', 'kai'
  agent_name TEXT NOT NULL,            -- e.g., 'Lena', 'Dev'
  agent_dept TEXT NOT NULL,            -- e.g., 'Marketing', 'Technical'
  prompt TEXT NOT NULL,                -- the test prompt given by the user
  expected_quality TEXT,               -- what good output should look like
  output TEXT,                         -- the generated output from the LLM
  score REAL NOT NULL DEFAULT 0,       -- 0-100 quality score
  passed BOOLEAN NOT NULL DEFAULT false, -- true if score >= threshold (80)
  areas_improved TEXT[],               -- e.g., ['Tone calibration', 'Structure']
  model_used TEXT DEFAULT 'deepseek-chat', -- which model generated the output
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by workshop
CREATE INDEX IF NOT EXISTS idx_training_runs_workshop ON training_runs (workshop_id, created_at DESC);

-- Index for querying by agent
CREATE INDEX IF NOT EXISTS idx_training_runs_agent ON training_runs (agent_name, created_at DESC);

-- Index for the improvement queue (failed runs that need retry)
CREATE INDEX IF NOT EXISTS idx_training_runs_failed ON training_runs (passed, created_at DESC) WHERE passed = false;
