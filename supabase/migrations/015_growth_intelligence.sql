-- Migration 015: Growth Intelligence System
-- Creates append-only snapshot tables for social, analytics, and competitor data.
-- Creates growth_baselines for Day-0 tracking.
-- 90-day retention managed by cleanup_old_snapshots() — called weekly by /api/growth/cleanup.
-- Run: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Social Snapshots (append-only) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_snapshots (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT        NOT NULL,
  platform    TEXT        NOT NULL CHECK (platform IN ('instagram', 'youtube', 'linkedin')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data        JSONB       NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_social_snap_venture ON social_snapshots(venture_id, platform, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_snap_time    ON social_snapshots(captured_at DESC);

-- ─── Analytics Snapshots (append-only) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id   TEXT        NOT NULL,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start DATE,
  period_end   DATE,
  data         JSONB       NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_snap_venture ON analytics_snapshots(venture_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snap_time    ON analytics_snapshots(captured_at DESC);

-- ─── Competitor Snapshots (append-only) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id     TEXT        NOT NULL,
  platform       TEXT        NOT NULL,
  competitor_url TEXT,
  captured_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_content    JSONB       NOT NULL,
  kai_analysis   JSONB
);

CREATE INDEX IF NOT EXISTS idx_competitor_snap_venture ON competitor_snapshots(venture_id, platform, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_snap_url     ON competitor_snapshots(venture_id, competitor_url);

-- ─── Growth Baselines ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS growth_baselines (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id     TEXT        NOT NULL,
  platform       TEXT        NOT NULL,
  metric_key     TEXT        NOT NULL,
  baseline_value NUMERIC     NOT NULL,
  baseline_date  DATE        NOT NULL,
  set_by         TEXT        NOT NULL DEFAULT 'auto', -- 'auto' | 'stark'
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venture_id, platform, metric_key)
);

CREATE INDEX IF NOT EXISTS idx_growth_baselines_venture ON growth_baselines(venture_id);

-- ─── 90-Day Retention Cleanup ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  cutoff           TIMESTAMPTZ := NOW() - INTERVAL '90 days';
  social_count     INT;
  analytics_count  INT;
  competitor_count INT;
BEGIN
  DELETE FROM social_snapshots     WHERE captured_at < cutoff;
  GET DIAGNOSTICS social_count     = ROW_COUNT;

  DELETE FROM analytics_snapshots  WHERE captured_at < cutoff;
  GET DIAGNOSTICS analytics_count  = ROW_COUNT;

  DELETE FROM competitor_snapshots WHERE captured_at < cutoff;
  GET DIAGNOSTICS competitor_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'social_deleted',     social_count,
    'analytics_deleted',  analytics_count,
    'competitor_deleted', competitor_count,
    'cutoff',             cutoff
  );
END;
$$;

COMMENT ON TABLE social_snapshots     IS 'Append-only. Never UPDATE/DELETE manually. 90-day retention via cleanup_old_snapshots().';
COMMENT ON TABLE analytics_snapshots  IS 'Append-only GA4 report snapshots. 90-day retention.';
COMMENT ON TABLE competitor_snapshots IS 'Append-only competitor scrape snapshots with Kai analysis. 90-day retention.';
COMMENT ON TABLE growth_baselines     IS 'Day-0 reference points. Auto-set on first snapshot per metric. Manual reset via /api/growth POST.';
COMMENT ON FUNCTION cleanup_old_snapshots IS 'Called by /api/growth/cleanup (weekly cron). Deletes rows older than 90 days from all snapshot tables.';
