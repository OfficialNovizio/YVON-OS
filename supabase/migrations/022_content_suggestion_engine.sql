-- ─────────────────────────────────────────────────────────────────────────────
-- 022_content_suggestion_engine.sql
-- Content Suggestion Engine — self-learning tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. content_performance — pitch → post → outcome tracking
CREATE TABLE IF NOT EXISTS content_performance (
  id                         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_slug               text NOT NULL,
  pitch_id                   uuid,               -- references intelligence_pitches
  calendar_entry_id          uuid,               -- references content_calendar
  platform                   text NOT NULL,
  format                     text NOT NULL,
  signal_type                text,               -- GAP_OPPORTUNITY | PROVEN_FORMAT | SEO_WINDOW | URGENCY_WINDOW | FUNNEL_FIX
  score_at_suggestion        numeric,            -- composite score when pitched
  score_breakdown            jsonb,              -- {E, R, G, B, T}
  growth_hypothesis          text,               -- IF [action] THEN [metric] BECAUSE [mechanism]
  posted_at                  timestamptz,
  measured_at                timestamptz,        -- stamped when 7-day measurement runs
  -- Actual metrics (from Apify or platform API)
  actual_views               bigint,
  actual_likes               bigint,
  actual_comments            bigint,
  actual_shares              bigint,
  actual_saves               bigint,
  actual_reach               bigint,
  actual_watch_time_avg      numeric,
  actual_interactions        bigint,
  -- Benchmarks at time of posting
  tier_benchmark_eng_rate    numeric,
  historical_avg_eng_rate    numeric,
  -- Outcome
  outcome                    text CHECK (outcome IN ('overperformed', 'met', 'underperformed')),
  outcome_delta              numeric,            -- % above/below expectation
  -- Source signals that triggered this pitch
  source_signals             jsonb,
  -- Learning outputs
  weight_adjustment_proposed jsonb,              -- proposed weight changes from this outcome
  weight_adjustment_approved boolean DEFAULT false,
  created_at                 timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_performance_venture ON content_performance(venture_slug);
CREATE INDEX IF NOT EXISTS idx_content_performance_measured ON content_performance(measured_at) WHERE measured_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_performance_signal ON content_performance(signal_type, venture_slug);

-- 2. signal_reliability — tracks how trustworthy each signal source is over time
CREATE TABLE IF NOT EXISTS signal_reliability (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_slug      text NOT NULL,
  signal_type       text NOT NULL,
  signal_source     text NOT NULL,   -- 'competitor_alert' | 'keyword_gap' | 'content_gap' | 'funnel_data' | 'tier_benchmark' | 'trending'
  total_pitches     integer DEFAULT 0,
  overperformed     integer DEFAULT 0,
  met_expectations  integer DEFAULT 0,
  underperformed    integer DEFAULT 0,
  reliability_score numeric DEFAULT 50,  -- 0–100, recalculated after each measurement
  last_updated      timestamptz DEFAULT now(),
  UNIQUE(venture_slug, signal_type, signal_source)
);

CREATE INDEX IF NOT EXISTS idx_signal_reliability_venture ON signal_reliability(venture_slug);

-- 3. scoring_weight_history — versioned weight changes, never destructive
CREATE TABLE IF NOT EXISTS scoring_weight_history (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_slug  text NOT NULL,
  version       integer NOT NULL,
  weights       jsonb NOT NULL,    -- {E: 0.25, R: 0.25, G: 0.20, B: 0.15, T: 0.15}
  reason        text,              -- why the change was proposed
  trigger_data  text,              -- which pattern triggered this (e.g. "URGENCY_WINDOW 67% underperform over 6 posts")
  status        text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by   text,              -- always 'user' — system never auto-applies
  cooldown_until timestamptz,      -- for rejected proposals: 14-day cooldown
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_history_venture ON scoring_weight_history(venture_slug, status);

-- 4. pitch_pass_reasons — every "Pass" click with reason, used in reflection
CREATE TABLE IF NOT EXISTS pitch_pass_reasons (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_slug   text NOT NULL,
  pitch_id       uuid,
  reason         text NOT NULL CHECK (reason IN ('already_done', 'wrong_timing', 'off_brand', 'tried_failed', 'other')),
  notes          text,
  requeue_at     timestamptz,       -- for 'wrong_timing': re-surface 14 days later
  signal_penalty boolean DEFAULT false,  -- true for 'tried_failed': full signal penalty applied
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pass_reasons_venture ON pitch_pass_reasons(venture_slug);
CREATE INDEX IF NOT EXISTS idx_pass_reasons_requeue ON pitch_pass_reasons(requeue_at) WHERE requeue_at IS NOT NULL;
