-- YVON Phase 3 — Full Platform Tables
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- Or via Cursor MCP: use the execute_sql tool with this content

-- ─── Ventures ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  color           TEXT DEFAULT '#E94560',
  ig_handle       TEXT,
  yt_channel_id   TEXT,
  li_profile_url  TEXT,
  ga4_property_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the two initial ventures
INSERT INTO ventures (name, slug, color) VALUES
  ('Novizio',  'novizio',  '#E94560'),
  ('Hourbour', 'hourbour', '#3B82F6')
ON CONFLICT (slug) DO NOTHING;

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT NOT NULL,
  agent_id    TEXT,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',     -- pending | in-progress | done
  priority    TEXT NOT NULL DEFAULT 'medium',      -- low | medium | high
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_venture_id_idx ON tasks (venture_id);

-- ─── Deliverables ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliverables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT NOT NULL,
  agent_id    TEXT,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,   -- strategy | content | report | design | code
  content     TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deliverables_venture_id_idx ON deliverables (venture_id);

-- ─── SOPs ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT,
  category    TEXT NOT NULL DEFAULT 'general',  -- marketing | technical | operations | design | finance | general
  agent_id    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sops_venture_id_idx ON sops (venture_id);

-- ─── Content Suggestions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_suggestions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id       TEXT NOT NULL,
  platform         TEXT NOT NULL,       -- instagram | linkedin
  content_type     TEXT NOT NULL,       -- reel | carousel | post
  topic            TEXT,
  caption          TEXT,
  hashtags         JSONB,
  audio_suggestion TEXT,
  hook             TEXT,
  hook_variants    JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_suggestions_venture_id_idx ON content_suggestions (venture_id);

-- ─── Competitor Content ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitor_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id       TEXT NOT NULL,
  platform         TEXT NOT NULL,       -- instagram | linkedin
  title            TEXT,
  description      TEXT,
  engagement_hint  TEXT,
  source_url       TEXT,
  fetched_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS competitor_content_venture_platform_idx ON competitor_content (venture_id, platform);

-- ─── Activity Feed ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  TEXT NOT NULL,
  agent_id    TEXT,
  type        TEXT NOT NULL,    -- content_generated | task_created | task_completed | deliverable_saved | sop_created | trending_refresh | brief_generated | social_refresh | agent_message
  message     TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_feed_venture_id_idx    ON activity_feed (venture_id);
CREATE INDEX IF NOT EXISTS activity_feed_created_at_idx    ON activity_feed (created_at DESC);

-- ─── Existing tables (already created in Phase 1+2 — included here for reference) ──
-- social_stats, analytics_reports, trending_items, conversations, messages,
-- briefs, agent_memory, agent_settings
-- Only run the CREATE TABLE IF NOT EXISTS blocks above — the ones below are no-ops if they exist.
