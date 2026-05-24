-- 033_target_audience.sql
-- Adds target audience configuration to ventures.
-- Seeds the Market Intelligence tab with demographic context.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS target_audience JSONB;

COMMENT ON COLUMN ventures.target_audience IS 'Target audience profile: { ageRange, gender, incomeTier, region, description }';
