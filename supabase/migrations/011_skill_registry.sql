-- Migration 011: Skill Registry (Hermes Phase 4)
-- Extends the existing skills table (migration 008) with:
--   trigger_keywords  — for FTS-based skill routing
--   variant           — lean | deep | null
--   learned_activations — JSONB self-improving memory (Hermes Phase 5)
--   skill_search      — tsvector for full-text routing
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- ─── Extend skills table ─────────────────────────────────────────────────────

ALTER TABLE skills
  ADD COLUMN IF NOT EXISTS agent_id           TEXT,
  ADD COLUMN IF NOT EXISTS variant            TEXT,
  ADD COLUMN IF NOT EXISTS trigger_keywords   TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learned_activations JSONB   DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS skill_search       TSVECTOR;

-- GIN index for trigger_keywords array overlap queries
-- Usage: SELECT * FROM skills WHERE trigger_keywords && ARRAY['framing','system1']
CREATE INDEX IF NOT EXISTS idx_skills_trigger_keywords ON skills USING GIN(trigger_keywords);

-- GIN index for FTS on name + description + trigger_keywords
CREATE INDEX IF NOT EXISTS idx_skills_skill_search ON skills USING GIN(skill_search);

-- GIN index for learned_activations JSONB queries
CREATE INDEX IF NOT EXISTS idx_skills_learned ON skills USING GIN(learned_activations);

-- Index for agent_id lookups
CREATE INDEX IF NOT EXISTS idx_skills_agent_id ON skills(agent_id);

-- ─── FTS trigger for skill_search ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION skills_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.skill_search :=
    setweight(to_tsvector('english', coalesce(NEW.name,        '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.trigger_keywords, ' '), '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS skills_search_trigger ON skills;
CREATE TRIGGER skills_search_trigger
  BEFORE INSERT OR UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION skills_search_update();

-- ─── Seed Kahneman skills ─────────────────────────────────────────────────────
-- Insert the two Kahneman skills into the registry so they are discoverable.

INSERT INTO skills (name, agent_id, variant, category, description, content, source, mode, trigger_keywords, assigned_agents)
VALUES
  (
    'consumer-psychology-lean',
    'daniel-kahneman',
    'lean',
    'psychology',
    'Fast psychological reasoning for high-frequency brand content — social posts, product copy, quick campaigns',
    'See agent-department/Psychology/Daniel_Kahneman/skills/01-kahneman.md',
    'custom',
    'custom',
    ARRAY['copy audit','framing check','system 1 filter','system1','lever selection','quick psychology','social post','product copy','ad copy','email copy','psychological review'],
    ARRAY['daniel-kahneman','lena-brand','rio-ads']
  ),
  (
    'consumer-psychology-deep',
    'daniel-kahneman',
    'deep',
    'psychology',
    'Full strategic psychological reasoning for campaigns, brand repositioning, website architecture, high-stakes decisions',
    'See agent-department/Psychology/Daniel_Kahneman/skills/02-kahneman.md',
    'custom',
    'custom',
    ARRAY['campaign strategy','brand repositioning','website redesign','product launch','high stakes','psychological audit','deep framing','ab test design','full audit','behavioral economics'],
    ARRAY['daniel-kahneman','marcus-ceo','felix-finance']
  )
ON CONFLICT (name) DO UPDATE SET
  agent_id         = EXCLUDED.agent_id,
  variant          = EXCLUDED.variant,
  trigger_keywords = EXCLUDED.trigger_keywords,
  assigned_agents  = EXCLUDED.assigned_agents,
  updated_at       = NOW();

COMMENT ON COLUMN skills.trigger_keywords    IS 'Keywords for FTS-based skill routing — array overlap query';
COMMENT ON COLUMN skills.learned_activations IS 'Hermes self-improving: [{date,brand,surface,lever,result,mechanismNote}]';
COMMENT ON COLUMN skills.variant             IS 'Skill variant: lean | deep | null for single-variant skills';
COMMENT ON COLUMN skills.agent_id            IS 'Primary agent that owns this skill';
