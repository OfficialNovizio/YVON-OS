-- ─── social_posts_cache table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts_cache (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id   TEXT        NOT NULL,
  platform     TEXT        NOT NULL,
  post_url     TEXT,
  caption      TEXT,
  post_date    DATE        NOT NULL,
  media_type   TEXT,
  scraped_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_posts_venture_date
  ON social_posts_cache (venture_id, platform, post_date DESC);

-- ─── Extend content_calendar with verification columns ──────────────────────
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS post_url     TEXT,
  ADD COLUMN IF NOT EXISTS verified_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_id  UUID;
