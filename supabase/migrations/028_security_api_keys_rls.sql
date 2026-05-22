-- Migration 028: Restrict ai_provider_keys to service_role only
-- The previous "Allow public read access" policy let anyone with the anon
-- key read API keys (Anthropic, custom LLM) in plaintext from the browser.
-- Run in: Supabase Dashboard → SQL Editor → New query → Run

-- Drop the four open policies
DROP POLICY IF EXISTS "Allow public read access"      ON ai_provider_keys;
DROP POLICY IF EXISTS "Allow authenticated insert"    ON ai_provider_keys;
DROP POLICY IF EXISTS "Allow authenticated update"    ON ai_provider_keys;
DROP POLICY IF EXISTS "Allow authenticated delete"    ON ai_provider_keys;

-- Single service_role-only policy — all access goes through /api/ai-keys
-- which masks keys before returning them to the browser.
CREATE POLICY ai_provider_keys_service_all
  ON ai_provider_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
