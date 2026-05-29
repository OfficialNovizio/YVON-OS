-- 044_competitor_tiers.sql
-- Adds tier classification and custom-brand flag to the competitors table.
-- tier: 'benchmark' = realistic peer (50k–200k followers)
--       'stretch'   = visible horizon (200k–600k)
--       'anchor'    = aspirational reference only (1M+), excluded from SOV/scoring
-- is_custom: true when the user manually added this brand from Settings

ALTER TABLE competitors
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'benchmark'
    CHECK (tier IN ('benchmark', 'stretch', 'anchor')),
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS competitors_tier_idx ON competitors (tier);
CREATE INDEX IF NOT EXISTS competitors_is_custom_idx ON competitors (is_custom) WHERE is_custom = true;
