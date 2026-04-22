-- YVON Phase 1 — Brand Pulse Data Foundation
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Phase 1: Data Foundation (Weeks 1-3)

-- ─── Revenue Events (Stripe Webhooks) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  event_type      TEXT NOT NULL,       -- charge.succeeded, charge.failed, chargeback, etc.
  amount          INTEGER NOT NULL,     -- in cents
  currency        TEXT DEFAULT 'usd',
  customer_email  TEXT,
  customer_id     TEXT,
  order_id        TEXT,
  session_id      TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  product_id      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  raw_webhook     JSONB
);

CREATE INDEX IF NOT EXISTS revenue_events_venture_id_idx ON revenue_events (venture_id);
CREATE INDEX IF NOT EXISTS revenue_events_created_at_idx ON revenue_events (created_at DESC);
CREATE INDEX IF NOT EXISTS revenue_events_session_id_idx ON revenue_events (session_id);
CREATE INDEX IF NOT EXISTS revenue_events_utm_idx ON revenue_events (utm_source, utm_medium, utm_campaign);

-- ─── PostHog Sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posthog_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  session_id      TEXT NOT NULL,
  distinct_id     TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  utm_term        TEXT,
  referrer        TEXT,
  device_type     TEXT,
  browser         TEXT,
  country         TEXT,
  pages_viewed    INTEGER DEFAULT 0,
  session_start   TIMESTAMPTZ,
  session_end     TIMESTAMPTZ,
  converted       BOOLEAN DEFAULT FALSE,
  conversion_value INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS posthog_sessions_venture_id_idx ON posthog_sessions (venture_id);
CREATE INDEX IF NOT EXISTS posthog_sessions_session_id_idx ON posthog_sessions (session_id);
CREATE INDEX IF NOT EXISTS posthog_sessions_distinct_id_idx ON posthog_sessions (distinct_id);
CREATE INDEX IF NOT EXISTS posthog_sessions_converted_idx ON posthog_sessions (converted) WHERE converted = true;

-- ─── Content Scores (Composite scoring per post) ───────────────────────────────
CREATE TABLE IF NOT EXISTS content_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  platform        TEXT NOT NULL,       -- instagram, youtube, linkedin, tiktok
  post_id         TEXT NOT NULL,       -- platform-specific post ID
  post_url        TEXT,
  caption_preview TEXT,
  reach           INTEGER DEFAULT 0,
  likes           INTEGER DEFAULT 0,
  comments        INTEGER DEFAULT 0,
  saves           INTEGER DEFAULT 0,
  shares          INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4),
  save_rate       DECIMAL(5,4),
  share_rate      DECIMAL(5,4),
  composite_score DECIMAL(6,4),        -- weighted composite: (reach*0.20) + (saves*0.40) + (shares*0.30) + (comments*0.10)
  post_date       DATE,
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, platform, post_id)
);

CREATE INDEX IF NOT EXISTS content_scores_venture_id_idx ON content_scores (venture_id);
CREATE INDEX IF NOT EXISTS content_scores_composite_idx ON content_scores (composite_score DESC);
CREATE INDEX IF NOT EXISTS content_scores_post_date_idx ON content_scores (post_date DESC);

-- ─── Audience Momentum (Week-over-week follower quality) ───────────────────────
CREATE TABLE IF NOT EXISTS audience_momentum (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          TEXT NOT NULL,
  platform           TEXT NOT NULL,
  week_start         DATE NOT NULL,      -- Monday of the week
  new_followers      INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,4),     -- engagement rate of the new followers (their first-week actions)
  follower_quality_score DECIMAL(5,4),  -- composite: (new_engagement * 0.6) + (save_rate * 0.4)
  trend_direction    TEXT,               -- up, down, stable
  trend_delta        DECIMAL(5,4),       -- week-over-week change
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, platform, week_start)
);

CREATE INDEX IF NOT EXISTS audience_momentum_venture_idx ON audience_momentum (venture_id);
CREATE INDEX IF NOT EXISTS audience_momentum_week_idx ON audience_momentum (week_start DESC);

-- ─── Anomaly Alerts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  alert_type      TEXT NOT NULL,       -- reach_drop, engagement_spike, revenue_anomaly, sentiment_shift, algorithm_change
  metric_name     TEXT NOT NULL,
  current_value   DECIMAL(10,2),
  baseline_value  DECIMAL(10,2),
  change_pct      DECIMAL(6,2),        -- percentage change from baseline
  severity        TEXT NOT NULL,        -- critical, warning, info
  message         TEXT,
  status          TEXT DEFAULT 'active', -- active, acknowledged, resolved
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS anomaly_alerts_venture_id_idx ON anomaly_alerts (venture_id);
CREATE INDEX IF NOT EXISTS anomaly_alerts_status_idx ON anomaly_alerts (status);
CREATE INDEX IF NOT EXISTS anomaly_alerts_created_at_idx ON anomaly_alerts (created_at DESC);

-- ─── Attribution Map (Post → Revenue Path) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS attribution_map (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  post_id         TEXT NOT NULL,       -- social post ID
  post_platform   TEXT NOT NULL,
  post_url        TEXT,
  post_date       DATE,
  session_id      TEXT,
  utm_params      JSONB,
  revenue_event_id UUID,              -- links to revenue_events
  revenue_amount  INTEGER,             -- in cents
  attribution_weight DECIMAL(4,2),    -- 0.0-1.0 confidence of attribution
  conversion_type TEXT,                -- first_touch, last_touch, assisted
  touchpoints     JSONB,               -- array of touchpoints in the path
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attribution_map_venture_id_idx ON attribution_map (venture_id);
CREATE INDEX IF NOT EXISTS attribution_map_post_id_idx ON attribution_map (post_id);
CREATE INDEX IF NOT EXISTS attribution_map_revenue_event_id_idx ON attribution_map (revenue_event_id);