-- 030_operating_countries.sql
-- Adds multi-country operation support to ventures.
-- Selected countries affect Analytics, Competitor, and Marketing dashboards.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS operating_countries TEXT[] DEFAULT '{}';

-- Update existing ventures with default countries
UPDATE ventures SET operating_countries = ARRAY['US'] WHERE operating_countries IS NULL OR operating_countries = '{}';
