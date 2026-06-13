#!/usr/bin/env npx tsx
// scripts/sync-hermes-tokens.ts
// Reads ~/.hermes/state.db → finds sessions since last sync → pushes to YVON Supabase token_usage.
//
// Usage:
//   npx tsx scripts/sync-hermes-tokens.ts
//
// Deduplication: tracks synced session IDs via ~/.hermes/.last_token_sync file.
// route='hermes-chat', agent_id='marcus-ceo' by default.

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// ─── Config ────────────────────────────────────────────────────────────────────

const HOME = homedir()
const STATE_DB = join(HOME, '.hermes', 'state.db')
const SYNC_STATE_FILE = join(HOME, '.hermes', '.last_token_sync')

const DEFAULT_AGENT_ID = process.env.HERMES_SYNC_AGENT_ID || 'marcus-ceo'
const DEFAULT_ROUTE = process.env.HERMES_SYNC_ROUTE || 'hermes-chat'

interface SyncState {
  lastSync: number  // unix ms timestamp
  syncedSessions: string[]  // session IDs already synced
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function readSyncState(): SyncState {
  try {
    if (existsSync(SYNC_STATE_FILE)) {
      const raw = readFileSync(SYNC_STATE_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {}
  return { lastSync: 0, syncedSessions: [] }
}

function writeSyncState(state: SyncState): void {
  try {
    writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch (err) {
    console.error('[sync-hermes-tokens] Failed to write sync state:', (err as Error).message)
  }
}

function getYvonCredentials() {
  // Read from .env.local in yvon project directory
  const envPath = join(__dirname, '..', '.env.local')
  let fileUrl = '', fileKey = ''
  try {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        if (line.startsWith('SUPABASE_URL=')) fileUrl = line.split('=')[1].trim()
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) fileKey = line.split('=').slice(1).join('=').trim()
      }
    }
  } catch {}
  
  const url = process.env.YVON_SUPABASE_URL || fileUrl || process.env.SUPABASE_URL || null
  const key = process.env.YVON_SUPABASE_SERVICE_ROLE_KEY || fileKey || process.env.SUPABASE_SERVICE_ROLE_KEY || null
  return { url, key }
}

async function pushTokenUsage(payload: Record<string, unknown>): Promise<boolean> {
  const { url, key } = getYvonCredentials()
  if (!url || !key) {
    console.error('[sync-hermes-tokens] YVON Supabase not configured. Set YVON_SUPABASE_URL and YVON_SUPABASE_SERVICE_ROLE_KEY.')
    return false
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${url}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.error(`[sync-hermes-tokens] Push failed: ${res.status} ${res.statusText}`)
      return false
    }
    return true
  } catch (err) {
    console.error('[sync-hermes-tokens] Push error:', (err as Error).message)
    return false
  }
}

async function checkSessionAlreadySynced(sessionId: string): Promise<boolean> {
  // Skip Supabase dedup check — session_id column not yet migrated
  // Dedup via local sync state only
  return false
}

// ─── Cost estimation ───────────────────────────────────────────────────────────

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Per-1M-token pricing
  const rates: Record<string, { input: number; output: number }> = {
    'deepseek-chat':          { input: 0.14, output: 0.28 },
    'deepseek-reasoner':      { input: 0.55, output: 2.19 },
    'deepseek-v4-pro':        { input: 0.14, output: 0.28 },
    'claude-opus-4-20250514': { input: 15,   output: 75 },
    'claude-sonnet-4-20250514': { input: 3,   output: 15 },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4 },
    'gpt-4o':                 { input: 2.5,  output: 10 },
    'gpt-4o-mini':            { input: 0.15, output: 0.60 },
  }

  // Try exact match first, then prefix match
  let rate = rates[model]
  if (!rate) {
    for (const [key, val] of Object.entries(rates)) {
      if (model.startsWith(key) || key.startsWith(model)) {
        rate = val
        break
      }
    }
  }
  if (!rate) rate = { input: 2, output: 8 } // default blended

  return Math.round(((inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output) * 100000) / 100000
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[sync-hermes-tokens] Starting sync...')

  // Check if state.db exists
  if (!existsSync(STATE_DB)) {
    console.log('[sync-hermes-tokens] No state.db found at', STATE_DB)
    process.exit(0)
  }

  // Load SQLite
  let Database: any
  try {
    // Try local node_modules first (yvon project)
    Database = require('better-sqlite3')
  } catch {
    // Try yvon-engine node_modules
    try {
      Database = require(join(HOME, 'yvon-engine', 'node_modules', 'better-sqlite3'))
    } catch {
      console.error('[sync-hermes-tokens] better-sqlite3 not found. Install it with: npm install better-sqlite3')
      process.exit(1)
    }
  }

  const db = new Database(STATE_DB, { readonly: true })

  // Read sync state
  const syncState = readSyncState()
  const sinceTimestamp = syncState.lastSync || 0

  console.log(`[sync-hermes-tokens] Last sync: ${sinceTimestamp ? new Date(sinceTimestamp).toISOString() : 'never'}`)
  console.log(`[sync-hermes-tokens] Previously synced sessions: ${syncState.syncedSessions.length}`)

  // Query sessions that ended since last sync (or started if not ended)
  // Sessions have input_tokens, output_tokens, estimated_cost_usd, model, billing_provider
  const sessions = db.prepare(`
    SELECT
      id,
      source,
      model,
      billing_provider,
      started_at,
      ended_at,
      input_tokens,
      output_tokens,
      estimated_cost_usd,
      actual_cost_usd,
      message_count,
      tool_call_count,
      cost_status
    FROM sessions
    WHERE (ended_at > ? OR (ended_at IS NULL AND started_at > ?))
      AND input_tokens + output_tokens > 0
    ORDER BY started_at ASC
  `).all(sinceTimestamp / 1000, sinceTimestamp / 1000) // state.db uses unix seconds

  console.log(`[sync-hermes-tokens] Found ${sessions.length} sessions with tokens since last sync`)

  let pushed = 0
  let skipped = 0
  let failed = 0
  const newSyncedIds: string[] = []

  for (const session of sessions) {
    const sessionId = session.id

    // Skip if already in local sync state
    if (syncState.syncedSessions.includes(sessionId)) {
      skipped++
      continue
    }

    // Skip if already in YVON Supabase (dedup check)
    const alreadySynced = await checkSessionAlreadySynced(sessionId)
    if (alreadySynced) {
      skipped++
      newSyncedIds.push(sessionId)
      continue
    }

    const provider = session.billing_provider || session.source || 'unknown'
    const model = session.model || 'unknown'
    const inputTokens = session.input_tokens || 0
    const outputTokens = session.output_tokens || 0
    const cost = session.actual_cost_usd || session.estimated_cost_usd || estimateCost(model, inputTokens, outputTokens)

    const payload = {
      agent_id: DEFAULT_AGENT_ID,
      route: DEFAULT_ROUTE,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: Math.round(cost * 100000) / 100000,
      created_at: session.ended_at
        ? new Date(session.ended_at * 1000).toISOString()
        : new Date(session.started_at * 1000).toISOString(),
    }

    const ok = await pushTokenUsage(payload)
    if (ok) {
      pushed++
      newSyncedIds.push(sessionId)
      console.log(`[sync-hermes-tokens] ✓ ${sessionId.slice(0, 8)}... — ${inputTokens + outputTokens} tokens, $${(cost as number).toFixed(4)}`)
    } else {
      failed++
    }
  }

  // Update sync state
  const now = Date.now()
  const updatedSynced = [...new Set([...syncState.syncedSessions, ...newSyncedIds])]
    .slice(-10000) // keep last 10k to prevent unbounded growth

  writeSyncState({
    lastSync: now,
    syncedSessions: updatedSynced,
  })

  console.log(`[sync-hermes-tokens] Done: ${pushed} pushed, ${skipped} skipped, ${failed} failed`)
  console.log(`[sync-hermes-tokens] Sync state updated (lastSync: ${new Date(now).toISOString()})`)

  db.close()

  if (failed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[sync-hermes-tokens] Fatal error:', err)
  process.exit(1)
})
