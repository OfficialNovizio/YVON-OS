/**
 * lib/secrets.ts — Server-side secret access via Supabase Vault.
 *
 * Replaces process.env.X for all runtime-only secrets. Boot-essential secrets
 * (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, NEXT_PUBLIC_*) still
 * come from process.env because they're needed to connect to Supabase itself.
 *
 * The MOVABLE_SECRETS list below is the authoritative inventory of secrets that
 * have been migrated to Vault. process.env fallback is supported during the
 * cutover period — once cleanup is done, fallback can be removed.
 *
 * Usage:
 *   import { getSecret } from '@/lib/secrets'
 *   const token = await getSecret('GITHUB_TOKEN')
 *
 * Concurrency-safe. Per-secret cache with 60s TTL. Fetches in flight are
 * de-duplicated so a burst of callers shares one DB roundtrip.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'

/** Secrets migrated to Vault. Order doesn't matter — list is informational. */
export const MOVABLE_SECRETS = [
  'GITHUB_TOKEN', 'APIFY_TOKEN', 'YOUTUBE_API_KEY', 'GOOGLE_SA_JSON',
  'GOOGLE_STITCH_API_KEY', 'ELEVENLABS_API_KEY', 'ICEBERG_TOKEN',
  'KREA_API_KEY', 'POSTHOG_API_KEY', 'POSTHOG_HOST',
  'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'SVIX_TOKEN', 'NOVIZIO_GA', 'HOURBOUR_GA',
  'NOVIZIO_DEPLOY_HOOK', 'HOURBOUR_DEPLOY_HOOK', 'BRANDNAME_DEPLOY_HOOK',
  'BRIEFING_EMAIL', 'CRON_SECRET', 'FACEBOOK_GRAPH_TOKEN',
  'YVON_GITHUB_OWNER', 'YVON_GITHUB_REPO',
  'WAR_ROOM_ENGINE', 'WAR_ROOM_ENGINE_V2',
] as const

export type MovableSecret = typeof MOVABLE_SECRETS[number]

interface CacheEntry {
  value:   string | null
  expiry:  number
  pending?: Promise<string | null>
}

const TTL_MS = 60_000
const cache  = new Map<string, CacheEntry>()

function client() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase credentials not configured')
  return createClient(url, key)
}

async function fetchFromVault(name: string): Promise<string | null> {
  const sb = client()
  const { data, error } = await sb.rpc('get_app_secret', { p_name: name })
  if (error) throw new Error(`Vault read failed for ${name}: ${error.message}`)
  return (data as string | null) ?? null
}

/**
 * Read a secret. Prefers Vault, falls back to process.env during cutover.
 * Cached for 60s. Concurrent calls share a single in-flight fetch.
 */
export async function getSecret(name: string): Promise<string | null> {
  const cached = cache.get(name)
  if (cached && Date.now() < cached.expiry) return cached.value
  if (cached?.pending) return cached.pending

  const pending = (async () => {
    let v = await fetchFromVault(name).catch(() => null)
    if (v == null && process.env[name]) v = process.env[name] ?? null
    cache.set(name, { value: v, expiry: Date.now() + TTL_MS })
    return v
  })()
  cache.set(name, { value: cached?.value ?? null, expiry: 0, pending })
  return pending
}

/** Same as getSecret but throws if missing. Use for required secrets. */
export async function getRequiredSecret(name: string): Promise<string> {
  const v = await getSecret(name)
  if (!v) throw new Error(`Required secret "${name}" not set in Vault or env`)
  return v
}

/** Write/upsert a secret. */
export async function setSecret(name: string, value: string, description = ''): Promise<void> {
  const sb = client()
  const { error } = await sb.rpc('set_app_secret', { p_name: name, p_value: value, p_description: description })
  if (error) throw new Error(`Vault write failed for ${name}: ${error.message}`)
  bustSecretCache(name)
}

/** Delete a secret. Returns true if it existed. */
export async function deleteSecret(name: string): Promise<boolean> {
  const sb = client()
  const { data, error } = await sb.rpc('delete_app_secret', { p_name: name })
  if (error) throw new Error(`Vault delete failed for ${name}: ${error.message}`)
  bustSecretCache(name)
  return data === true
}

/** List secret names + descriptions (NEVER values). Safe for admin UI. */
export async function listSecrets(): Promise<Array<{ name: string; description: string; updatedAt: string }>> {
  const sb = client()
  const { data, error } = await sb.rpc('list_app_secrets')
  if (error) throw new Error(`Vault list failed: ${error.message}`)
  return (data ?? []).map((r: { name: string; description: string | null; updated_at: string }) => ({
    name:        r.name,
    description: r.description ?? '',
    updatedAt:   r.updated_at,
  }))
}

/** Invalidate cache for one or all secrets. Call after setSecret/deleteSecret. */
export function bustSecretCache(name?: string) {
  if (name) cache.delete(name)
  else cache.clear()
}
