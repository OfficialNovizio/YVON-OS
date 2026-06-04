-- Migration 047: Add conversation_history to execution_plans
-- Stores the full multi-turn conversation so history sidebar shows complete chats.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE execution_plans
  ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN execution_plans.conversation_history
  IS 'Array of {user, marcus} turn objects — full multi-turn chat history for this session';
