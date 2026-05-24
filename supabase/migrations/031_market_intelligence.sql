-- 031_market_intelligence.sql
-- Stores weekly snapshots of market intelligence data per venture per country.
-- Module data includes TAM/SAM/SOM, demographics, customer growth, demand index,
-- whitespace matrix, competitive position, and forecast scenarios.
-- Populated by Kai weekly via /api/market-intelligence refresh.

CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  country TEXT NOT NULL DEFAULT 'global',
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  module_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mi_venture_date ON market_intelligence(venture_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_mi_venture_country ON market_intelligence(venture_id, country);

-- Row-level security: ventures can only see their own data
ALTER TABLE market_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_intelligence_venture_isolation"
  ON market_intelligence
  FOR ALL
  USING (venture_id = auth.uid()::uuid);
