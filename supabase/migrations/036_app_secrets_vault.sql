-- 036_app_secrets_vault.sql
-- App secrets stored in Supabase Vault (pgsodium-encrypted at rest).
-- Replaces process.env.* for all runtime-only secrets. Boot-essential secrets
-- (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, NEXT_PUBLIC_*)
-- remain in env because they're needed before we can connect to Supabase.

-- Supabase has Vault pre-enabled on hosted projects. These wrappers give us a
-- service-role-only API for read/write so app code never touches vault.* directly.

-- ─── Wrapper: upsert a secret by name ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_app_secret(
  p_name        TEXT,
  p_value       TEXT,
  p_description TEXT DEFAULT ''
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name;
  IF v_id IS NULL THEN
    SELECT vault.create_secret(p_value, p_name, p_description) INTO v_id;
  ELSE
    PERFORM vault.update_secret(v_id, p_value, p_name, p_description);
  END IF;
  RETURN v_id;
END;
$$;

-- ─── Wrapper: read a secret by name ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_app_secret(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = p_name LIMIT 1;
$$;

-- ─── Wrapper: list secrets (names + descriptions only, NEVER the values) ──────
CREATE OR REPLACE FUNCTION list_app_secrets()
RETURNS TABLE(name TEXT, description TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = vault, public
AS $$
  SELECT name, description, updated_at FROM vault.secrets ORDER BY name;
$$;

-- ─── Wrapper: delete a secret by name ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_app_secret(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, public
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = p_name;
  IF v_id IS NULL THEN
    RETURN FALSE;
  END IF;
  DELETE FROM vault.secrets WHERE id = v_id;
  RETURN TRUE;
END;
$$;

-- Restrict execution to service_role only (server-side routes use service role).
-- This prevents any browser/anon access to secret values.
REVOKE EXECUTE ON FUNCTION set_app_secret(TEXT, TEXT, TEXT)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_app_secret(TEXT)                FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION list_app_secrets()                  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION delete_app_secret(TEXT)             FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION set_app_secret(TEXT, TEXT, TEXT)     TO service_role;
GRANT EXECUTE ON FUNCTION get_app_secret(TEXT)                 TO service_role;
GRANT EXECUTE ON FUNCTION list_app_secrets()                   TO service_role;
GRANT EXECUTE ON FUNCTION delete_app_secret(TEXT)              TO service_role;
