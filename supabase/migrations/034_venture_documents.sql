-- 034_venture_documents.sql
-- Stores per-venture brand/design/context/feedback markdown in the database
-- so editors can manage them from the UI and agents pull live content.
-- Replaces the file-system reads in docs/ventures/[slug]/{CONTEXT,BRAND,DESIGN,FEEDBACK}.md

CREATE TABLE IF NOT EXISTS venture_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_slug TEXT NOT NULL,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('context','brand','design','feedback')),
  content      TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (venture_slug, doc_type)
);

CREATE INDEX IF NOT EXISTS venture_documents_slug_idx ON venture_documents (venture_slug);

COMMENT ON TABLE venture_documents IS
  'Per-venture markdown documents (brand, design, context, feedback). Edited from Settings → Venture; consumed by War Room agents.';

-- RLS: service_role only (browser must go through /api/venture-documents which auth-checks via middleware)
ALTER TABLE venture_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venture_documents_service_all ON venture_documents;
CREATE POLICY venture_documents_service_all
  ON venture_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Touch trigger to keep updated_at fresh on UPDATEs
CREATE OR REPLACE FUNCTION touch_venture_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_venture_documents_updated_at ON venture_documents;
CREATE TRIGGER trg_venture_documents_updated_at
  BEFORE UPDATE ON venture_documents
  FOR EACH ROW
  EXECUTE FUNCTION touch_venture_documents_updated_at();
