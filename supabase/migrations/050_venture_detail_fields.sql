-- 050_venture_detail_fields.sql
-- Adds rich venture detail fields for the Settings → Venture detail page.
--
-- operating_cities  — list of cities where the brand operates
-- ios_app_url       — iOS App Store link
-- android_app_url   — Google Play Store link
-- hosting_platform  — deployment platform (vercel, aws, custom, etc.)
-- product_categories — hierarchical product type tree (JSONB)

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS operating_cities TEXT[];
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS ios_app_url TEXT;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS android_app_url TEXT;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS hosting_platform TEXT;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS product_categories JSONB;

COMMENT ON COLUMN ventures.operating_cities    IS 'Cities where the brand operates, e.g. ["Mumbai","Delhi","Bangalore"]';
COMMENT ON COLUMN ventures.ios_app_url         IS 'Apple App Store URL for iOS app';
COMMENT ON COLUMN ventures.android_app_url     IS 'Google Play Store URL for Android app';
COMMENT ON COLUMN ventures.hosting_platform    IS 'Hosting platform: vercel, aws, railway, custom, etc.';
COMMENT ON COLUMN ventures.product_categories  IS 'Hierarchical product categories: [{category, subcategories[]}]';
