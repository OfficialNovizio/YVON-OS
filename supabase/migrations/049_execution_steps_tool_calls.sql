-- Persist per-agent tool calls and the conversation turn each step belongs to,
-- so War Room agent cards (with their full tool breakdown) can be restored from
-- history after a refresh — previously only the final synthesis survived reload.
ALTER TABLE execution_steps ADD COLUMN IF NOT EXISTS tool_calls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE execution_steps ADD COLUMN IF NOT EXISTS turn_index INTEGER DEFAULT 0;
