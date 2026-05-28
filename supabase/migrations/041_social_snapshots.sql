-- 041_social_snapshots.sql
-- Extends the existing social_snapshots table (015_growth_intelligence) for
-- Apify cache control, and adds a social_posts table for per-post analytics.

-- ── 1. Extend social_snapshots ───────────────────────────────────────────────

-- Add venture_slug alias (015 uses venture_id; newer code uses venture_slug)
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS venture_slug TEXT;

-- Add handle so we know which account was scraped
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS handle TEXT;

-- Structured metrics (replaces querying raw JSONB each time)
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS followers       INTEGER;
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS following       INTEGER;
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS posts_count     INTEGER;
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS avg_likes       NUMERIC(10,2);
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS avg_comments    NUMERIC(10,2);
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS avg_views       NUMERIC(10,2);
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC(6,4);

-- Cache control — only re-fetch when expired or user clicks Refresh
ALTER TABLE social_snapshots ADD COLUMN IF NOT EXISTS cache_expires_at TIMESTAMPTZ
  DEFAULT (NOW() + INTERVAL '24 hours');

-- Extend platform CHECK to include tiktok (015 had instagram/youtube/linkedin only)
ALTER TABLE social_snapshots DROP CONSTRAINT IF EXISTS social_snapshots_platform_check;
ALTER TABLE social_snapshots ADD CONSTRAINT social_snapshots_platform_check
  CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'youtube'));

-- Index for cache-first lookup pattern
CREATE INDEX IF NOT EXISTS idx_social_snapshots_cache
  ON social_snapshots (venture_slug, platform, handle, cache_expires_at);

-- ── 2. social_posts — per-post analytics ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_slug    TEXT NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'youtube')),
  post_id         TEXT NOT NULL,
  handle          TEXT,
  url             TEXT,
  caption         TEXT,
  post_type       TEXT,     -- reel | carousel | static | story | short | article
  likes           INTEGER DEFAULT 0,
  comments        INTEGER DEFAULT 0,
  shares          INTEGER DEFAULT 0,
  saves           INTEGER DEFAULT 0,
  views           INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  engagement_rate NUMERIC(6,4),
  published_at    TIMESTAMPTZ,
  raw_data        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (venture_slug, platform, post_id)
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_posts" ON social_posts;
CREATE POLICY "service_role_all_posts" ON social_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_social_posts_lookup
  ON social_posts (venture_slug, platform, published_at DESC);
