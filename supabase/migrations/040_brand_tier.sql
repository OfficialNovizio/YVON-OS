-- 040_brand_tier.sql
-- Adds brand positioning tier and average price point to ventures.
-- brand_tier anchors all Market Intelligence calculations to the correct
-- competitive segment — prevents generic market figures being applied to
-- premium/luxury brands and vice versa.

ALTER TABLE ventures
  ADD COLUMN IF NOT EXISTS brand_tier      VARCHAR(32),
  ADD COLUMN IF NOT EXISTS avg_price_point INTEGER;

COMMENT ON COLUMN ventures.brand_tier      IS 'Pricing/positioning tier: budget | fast-fashion | mid-market | contemporary | premium | luxury | ultra-luxury';
COMMENT ON COLUMN ventures.avg_price_point IS 'Average single-product price point in local currency (INR for India brands)';
