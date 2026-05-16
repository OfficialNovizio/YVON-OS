-- Migration 021: clothing_items
-- Stores the active clothing line per venture for the Creative Studio Outfit Builder.

CREATE TABLE IF NOT EXISTS clothing_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID        NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('top','bottom','outerwear','footwear','accessory')),
  description TEXT        NOT NULL DEFAULT '',
  color       TEXT        NOT NULL DEFAULT '',
  season      TEXT        NOT NULL DEFAULT 'all',
  active      BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clothing_items_venture ON clothing_items (venture_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_active  ON clothing_items (venture_id, active);

-- Seed Novizio defaults (resolved via slug → id at runtime; used as template only)
-- Run after ventures table has the novizio row.
-- Actual seeding happens through the API on first load if table is empty for venture.
