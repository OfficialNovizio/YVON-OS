-- ─── content_calendar table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_calendar (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id   TEXT        NOT NULL,
  plan_date    DATE        NOT NULL,
  content_type TEXT        NOT NULL,
  platform     TEXT        NOT NULL,
  headline     TEXT,
  brief        TEXT,
  status       TEXT        NOT NULL DEFAULT 'planned'
               CHECK (status IN ('planned', 'in-production', 'posted')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_calendar_venture_date
  ON content_calendar (venture_id, plan_date);
