-- 042_kai_reports.sql
-- Persists Kai intelligence reports in Supabase (cross-device access).

CREATE TABLE IF NOT EXISTS kai_reports (
  id                TEXT PRIMARY KEY,
  venture_slug      TEXT NOT NULL,
  venture_name      TEXT NOT NULL,
  period            TEXT NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary           TEXT NOT NULL,
  situation_title   TEXT,
  situation_body    TEXT,
  diagnosis_title   TEXT,
  diagnosis_body    TEXT,
  action_title      TEXT,
  action_body       TEXT,
  prescription_title TEXT,
  prescription_body TEXT,
  key_metrics       JSONB DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_kai_reports" ON kai_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_kai_reports_venture
  ON kai_reports (venture_slug, generated_at DESC);
