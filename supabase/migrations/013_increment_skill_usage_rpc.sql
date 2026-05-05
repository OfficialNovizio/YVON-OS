-- Migration 013: Add increment_skill_usage RPC
-- Called by trackSkillUsage() in lib/db.ts (Phase E)
-- Atomically increments use_count and sets last_used_at for a skill by name.

CREATE OR REPLACE FUNCTION increment_skill_usage(skill_name TEXT)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE skills
  SET
    use_count    = COALESCE(use_count, 0) + 1,
    last_used_at = NOW()
  WHERE name = skill_name;
$$;
