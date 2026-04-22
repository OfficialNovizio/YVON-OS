-- ─── roadmap_items table: in-flight roadmap display ──────────────────────────
CREATE TABLE IF NOT EXISTS roadmap_items (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  priority   TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'scoped'
             CHECK (status IN ('scoped', 'in-flight', 'shipped')),
  dri        TEXT,
  notes      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with current roadmap state (run after creating table)
INSERT INTO roadmap_items (title, priority, status, dri) VALUES
  ('Brand Sidebar + Venture Scoping',      'P1-A', 'shipped',   'Mia + Raj'),
  ('Project Memory + Selective Loading',   'P1-B', 'shipped',   'Stark'),
  ('Data → Decision Layer',                'P2-A', 'in-flight', 'Kai + Mia'),
  ('Agent WebSearch + Contradiction',      'P2-B', 'in-flight', 'Dev'),
  ('Approval Mechanism in /inbox',         'P3-A', 'in-flight', 'Raj + Mia'),
  ('Daily Session Persistence',            'P3-B', 'scoped',    'Raj'),
  ('Brand Intelligence Pipeline',          'P4-A', 'scoped',    'Kai + Lena + Atlas'),
  ('Sidebar Quick Access + Scout',         'P4-B', 'shipped',   'Mia'),
  ('GitHub Integration',                   'P5-A', 'in-flight', 'Dev + Raj'),
  ('Weekly API Cost Report',               'P6-A', 'in-flight', 'Felix + Raj'),
  ('Roadmap View on CEO Page',             'P7-A', 'in-flight', 'Mia + Raj')
ON CONFLICT DO NOTHING;
