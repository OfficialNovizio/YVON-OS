-- 019_token_usage_session_id.sql
-- Adds session_id column for Hermes sync deduplication
-- Safe to run multiple times — uses IF NOT EXISTS

alter table token_usage add column if not exists session_id text;

create index if not exists token_usage_session_id_idx
  on token_usage (session_id);
