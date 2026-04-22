-- YVON Phase 3 — Market Radar Tables
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Competitors ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  brand_name      TEXT NOT NULL,
  url             TEXT,
  signal_score    DECIMAL(5,2) DEFAULT 0,
  follower_growth_rate DECIMAL(6,2) DEFAULT 0,
  traffic_spike_detected BOOLEAN DEFAULT FALSE,
  viral_content_count INTEGER DEFAULT 0,
  funding_round_detected BOOLEAN DEFAULT FALSE,
  share_of_voice  DECIMAL(5,2) DEFAULT 0,
  week_over_week_change DECIMAL(6,2) DEFAULT 0,
  last_checked    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, brand_name)
);

CREATE INDEX IF NOT EXISTS competitors_venture_id_idx ON competitors (venture_id);
CREATE INDEX IF NOT EXISTS competitors_signal_score_idx ON competitors (signal_score DESC);

-- ─── Competitor Metrics ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  followers       INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  monthly_reach   INTEGER DEFAULT 0,
  estimated_monthly_traffic INTEGER DEFAULT 0,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitor_metrics_competitor_id_idx ON competitor_metrics (competitor_id);
CREATE INDEX IF NOT EXISTS competitor_metrics_recorded_at_idx ON competitor_metrics (recorded_at DESC);

-- ─── Territory Clusters ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS territory_clusters (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            TEXT NOT NULL,
  cluster_name          TEXT NOT NULL,
  keywords              JSONB DEFAULT '[]',
  saturation_score      DECIMAL(5,2) DEFAULT 0,
  competitor_ownership  JSONB DEFAULT '[]',
  engagement_ceiling    DECIMAL(5,2) DEFAULT 0,
  is_claimed            BOOLEAN DEFAULT FALSE,
  trend_direction       TEXT DEFAULT 'stable',
  recommended_posting_frequency TEXT DEFAULT 'weekly',
  first_mover_alert     BOOLEAN DEFAULT FALSE,
  score                 DECIMAL(6,2) DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, cluster_name)
);

CREATE INDEX IF NOT EXISTS territory_clusters_venture_id_idx ON territory_clusters (venture_id);
CREATE INDEX IF NOT EXISTS territory_clusters_score_idx ON territory_clusters (score DESC);
CREATE INDEX IF NOT EXISTS territory_clusters_claimed_idx ON territory_clusters (is_claimed) WHERE is_claimed = false;
