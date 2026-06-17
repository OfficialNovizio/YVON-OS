-- Migration: Hermes VPS connection config
-- Stores remote Hermes server IP/credentials securely in Supabase
-- Never stored in local config files or git

CREATE TABLE IF NOT EXISTS hermes_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    TEXT NOT NULL DEFAULT 'yvon',
  ssh_user      TEXT NOT NULL DEFAULT 'root',
  remote_host   TEXT NOT NULL,              -- IP or hostname
  ssh_port      INTEGER DEFAULT 22,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  last_sync_at  TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  
  UNIQUE(project_id)
);

-- RLS: only service role can read/write
ALTER TABLE hermes_connections ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE hermes_connections IS 'Hermes Agent VPS connection config — IP protected behind Supabase RLS';
