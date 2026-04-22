-- YVON Phase 3 Complete — Campaign Studio & Growth Support Tables
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Campaigns (Campaign Cards) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  goal            TEXT,
  product         TEXT,
  target_emotion  TEXT,
  platform        TEXT,
  brief           TEXT,
  status          TEXT DEFAULT 'draft',           -- draft, ideas, approved, in_production, scheduled, live, analysed
  selected_idea   TEXT,
  brand_dna_id    UUID,
  experiment_id   UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_venture_id_idx ON campaigns (venture_id);
CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns (status);

-- ─── Campaign Ideas (5 concepts per campaign) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_ideas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  hook            TEXT,
  format          TEXT,               -- reel, carousel, post, story
  angle           TEXT,
  expected_impact TEXT,               -- high, medium, low
  approved        BOOLEAN DEFAULT FALSE,
  score           DECIMAL(4,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaign_ideas_campaign_id_idx ON campaign_ideas (campaign_id);

-- ─── Campaign Assets (scripts, captions, voiceover, images) ────────────────────
CREATE TABLE IF NOT EXISTS campaign_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL,      -- script, caption, voiceover_brief, image_prompt, generated_image, audio
  content         JSONB,              -- flexible: script scenes, caption text, prompt, image URL
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaign_assets_campaign_id_idx ON campaign_assets (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_assets_type_idx ON campaign_assets (asset_type);

-- ─── Experiments (variant pairs with 48h kill windows) ────────────────────────
CREATE TABLE IF NOT EXISTS experiments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  original_post_id TEXT NOT NULL,
  variant_post_id  TEXT NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  kill_at         TIMESTAMPTZ,        -- 48 hours from started_at
  original_metrics JSONB DEFAULT '{}',
  variant_metrics  JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'running', -- running, completed, killed
  winner          TEXT,               -- original, variant
  confidence      DECIMAL(5,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS experiments_venture_id_idx ON experiments (venture_id);
CREATE INDEX IF NOT EXISTS experiments_status_idx ON experiments (status);

-- ─── Content Variants (Content Multiplier output) ──────────────────────────────
CREATE TABLE IF NOT EXISTS content_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  original_post_id TEXT NOT NULL,
  platform        TEXT NOT NULL,
  format          TEXT,
  hook            TEXT,
  caption         TEXT,
  hashtags        JSONB,
  cta             TEXT,
  best_time_to_post TEXT,
  status          TEXT DEFAULT 'pending', -- pending, deployed, performed
  performance     JSONB,
  deployed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_variants_venture_id_idx ON content_variants (venture_id);
CREATE INDEX IF NOT EXISTS content_variants_original_idx ON content_variants (original_post_id);

-- ─── Brand DNA (learned voice profile) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brand_dna (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  voice_profile   JSONB,              -- tone words, sentence structure, vocab, banned words
  learned_from    JSONB,              -- post IDs that informed this profile
  consistency_score DECIMAL(4,2),     -- 0-100, how on-brand recent content is
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id)
);

CREATE INDEX IF NOT EXISTS brand_dna_venture_id_idx ON brand_dna (venture_id);

-- ─── Narrative Arcs (4-week sequences) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS narrative_arcs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  title           TEXT NOT NULL,
  theme           TEXT,
  week_count      INTEGER DEFAULT 4,
  arc_plan        JSONB,              -- 4-week plan with weekly themes + post schedule
  start_date      DATE,
  status          TEXT DEFAULT 'planned', -- planned, active, completed
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS narrative_arcs_venture_id_idx ON narrative_arcs (venture_id);
CREATE INDEX IF NOT EXISTS narrative_arcs_status_idx ON narrative_arcs (status);

-- ─── Community Signals (extracted audience desires) ────────────────────────────
CREATE TABLE IF NOT EXISTS community_signals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  source          TEXT NOT NULL,      -- reddit, tiktok_comments, discord, twitter
  topic           TEXT,
  sentiment       TEXT,               -- positive, negative, neutral, requesting
  extracted_desire TEXT,             -- what audience is asking for
  frequency       INTEGER DEFAULT 1,  -- how often this signal appears
  source_url      TEXT,
  detected_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS community_signals_venture_id_idx ON community_signals (venture_id);
CREATE INDEX IF NOT EXISTS community_signals_source_idx ON community_signals (source);

-- ─── Creator Profiles (rising micro-creators) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS creator_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  name            TEXT NOT NULL,
  handle          TEXT,
  platform        TEXT NOT NULL,
  follower_count  INTEGER,
  engagement_rate DECIMAL(5,4),
  niche           TEXT,
  collaboration_score DECIMAL(5,2),
  outreach_brief  TEXT,
  status          TEXT DEFAULT 'discovered', -- discovered, contacted, partnered
  url             TEXT,
  discovered_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS creator_profiles_venture_id_idx ON creator_profiles (venture_id);
CREATE INDEX IF NOT EXISTS creator_profiles_score_idx ON creator_profiles (collaboration_score DESC);

-- ─── Crisis Alerts (sentiment spikes, brand mention monitoring) ────────────────
CREATE TABLE IF NOT EXISTS crisis_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  alert_type      TEXT NOT NULL,      -- negative_sentiment, brand_attack, customer_complaint_viral, misinformation, pr_crisis
  severity        TEXT NOT NULL,      -- low, medium, high, critical
  brand_name      TEXT,
  trigger_data    JSONB,
  message         TEXT,
  status          TEXT DEFAULT 'active', -- active, acknowledged, resolved, escalated
  acknowledged_at TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crisis_alerts_venture_id_idx ON crisis_alerts (venture_id);
CREATE INDEX IF NOT EXISTS crisis_alerts_severity_idx ON crisis_alerts (severity);
CREATE INDEX IF NOT EXISTS crisis_alerts_status_idx ON crisis_alerts (status);

-- ─── Channel Conviction (highest-leverage platform signal) ─────────────────────
CREATE TABLE IF NOT EXISTS channel_conviction (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      TEXT NOT NULL,
  recommended_channel TEXT NOT NULL,
  confidence      DECIMAL(4,2),
  reason          TEXT,
  metrics         JSONB,
  calculated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, recommended_channel)
);

CREATE INDEX IF NOT EXISTS channel_conviction_venture_id_idx ON channel_conviction (venture_id);
