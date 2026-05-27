-- 037_war_room_commands.sql
-- Custom slash commands for the War Room input bar.
-- Merges with hardcoded defaults at runtime (same cmd key overrides default).

CREATE TABLE IF NOT EXISTS war_room_commands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cmd         TEXT NOT NULL UNIQUE,         -- e.g. '/report'
  label       TEXT NOT NULL,               -- shown in dropdown
  prompt      TEXT NOT NULL,               -- full prompt text sent to agents
  sort_order  INTEGER NOT NULL DEFAULT 0,  -- lower = earlier in list
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS war_room_commands_sort ON war_room_commands (sort_order, cmd);
