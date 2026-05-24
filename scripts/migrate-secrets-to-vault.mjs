#!/usr/bin/env node
/**
 * One-shot migration: reads each MOVABLE secret from process.env and writes it
 * to Supabase Vault via the set_app_secret RPC. Does NOT modify .env.local —
 * that's a separate manual step once we've verified all call sites are refactored.
 *
 * Run: node --env-file=.env.local scripts/migrate-secrets-to-vault.mjs
 */
import { createClient } from '@supabase/supabase-js'

const MOVABLE_SECRETS = [
  'GITHUB_TOKEN', 'APIFY_TOKEN', 'YOUTUBE_API_KEY', 'GOOGLE_SA_JSON',
  'GOOGLE_STITCH_API_KEY', 'ELEVENLABS_API_KEY', 'ICEBERG_TOKEN',
  'KREA_API_KEY', 'POSTHOG_API_KEY', 'POSTHOG_HOST',
  'RESEND_API_KEY', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
  'SVIX_TOKEN', 'NOVIZIO_GA', 'HOURBOUR_GA',
  'NOVIZIO_DEPLOY_HOOK', 'HOURBOUR_DEPLOY_HOOK', 'BRANDNAME_DEPLOY_HOOK',
  'BRIEFING_EMAIL', 'CRON_SECRET',
  'YVON_GITHUB_OWNER', 'YVON_GITHUB_REPO',
  'WAR_ROOM_ENGINE',
]

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  let written = 0, skipped = 0

  for (const name of MOVABLE_SECRETS) {
    const value = process.env[name]
    if (!value) { console.log(`  ⏭  ${name.padEnd(28)} not set in env, skipped`); skipped++; continue }
    const { error } = await sb.rpc('set_app_secret', {
      p_name: name,
      p_value: value,
      p_description: `Migrated from .env.local on ${new Date().toISOString().slice(0,10)}`,
    })
    if (error) { console.log(`  ✗ ${name}: ${error.message}`); process.exit(2) }
    console.log(`  ✓ ${name.padEnd(28)} ${value.length} chars`)
    written++
  }
  console.log(`\nDone — ${written} written, ${skipped} skipped (not in env).`)
}

main().catch(e => { console.error(e); process.exit(1) })
