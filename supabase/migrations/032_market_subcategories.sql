-- 032_market_subcategories.sql
-- Adds hierarchical market subcategory support to ventures.
-- Stores the selected leaf categories as TEXT[] (e.g. {"clothing > womenswear", "clothing > menswear"})

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS market_subcategories TEXT[];
