-- ─── decisions table: CEO approval workflow ──────────────────────────────────
CREATE TABLE IF NOT EXISTS decisions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT        NOT NULL,
  agent_id    TEXT        NOT NULL,
  decision_text TEXT      NOT NULL,
  question    TEXT,
  action_taken TEXT       CHECK (action_taken IN ('approved', 'rejected', 'deferred')),
  urgency     TEXT        CHECK (urgency IN ('critical', 'today', 'this-week')) DEFAULT 'this-week',
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decisions_venture_created
  ON decisions (venture_id, created_at DESC);

CREATE INDEX IF NOT EXISTS decisions_unresolved
  ON decisions (venture_id)
  WHERE action_taken IS NULL;

-- ─── daily_logs table: agent session persistence ──────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT        NOT NULL,
  agent_id    TEXT        NOT NULL,
  task        TEXT        NOT NULL,
  outcome     TEXT,
  notes       TEXT,
  log_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_logs_venture_date
  ON daily_logs (venture_id, log_date DESC);
