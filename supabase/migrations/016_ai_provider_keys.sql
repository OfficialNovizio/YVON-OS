-- YVON AI Provider Keys Table
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

-- Create the table
CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL,
  api_key         TEXT,
  fast_model      TEXT NOT NULL DEFAULT '',
  synthesis_model TEXT NOT NULL DEFAULT '',
  tertiary_model  TEXT DEFAULT '',
  base_url        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ai_provider_keys_provider_idx ON ai_provider_keys (provider);

-- Enable Row Level Security
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;

-- Allow public to read (for the settings page to display configured providers)
CREATE POLICY "Allow public read access"
  ON ai_provider_keys
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert (for saving provider keys)
CREATE POLICY "Allow authenticated insert"
  ON ai_provider_keys
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update (for updating provider keys)
CREATE POLICY "Allow authenticated update"
  ON ai_provider_keys
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete (for removing provider keys)
CREATE POLICY "Allow authenticated delete"
  ON ai_provider_keys
  FOR DELETE
  USING (true);

-- Insert a default Anthropic provider if none exists
INSERT INTO ai_provider_keys (provider, api_key, fast_model, synthesis_model, is_active)
VALUES ('anthropic', '', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6', true)
ON CONFLICT (provider) DO NOTHING;
