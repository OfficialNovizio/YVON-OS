-- 020 Content Intelligence — Big Idea + Content Series
-- Phase 6: brand_big_idea JSONB on ventures
-- Phase 8: content_series table

-- ── Big Idea on ventures ─────────────────────────────────────────────────────
ALTER TABLE ventures
  ADD COLUMN IF NOT EXISTS brand_big_idea JSONB DEFAULT NULL;

COMMENT ON COLUMN ventures.brand_big_idea IS
  'FAN framework Big Idea: brand_name_meaning, ideal_person, their_traits, gathering_activity, mission_beyond_product, platform_focus';

-- ── Content Series Registry ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_series (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  format        TEXT        NOT NULL DEFAULT 'reel',
  frequency     TEXT        NOT NULL DEFAULT 'weekly',
  platform      TEXT        NOT NULL DEFAULT 'instagram',
  fan_goal      TEXT        NOT NULL DEFAULT 'advocate',
  active        BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_series_venture ON content_series (venture_id);
CREATE INDEX IF NOT EXISTS idx_content_series_active  ON content_series (venture_id, active);
