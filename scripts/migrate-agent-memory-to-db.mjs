#!/usr/bin/env node
/**
 * One-shot data migration: reads every agent-department/[Dept]/[agent]/MEMORY.md
 * and upserts it into the agent_memory table.
 *
 * Idempotent.
 * Run: node --env-file=.env.local scripts/migrate-agent-memory-to-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const AGENT_MEMORY_PATHS = {
  'marcus-ceo':         'agent-department/CEO/marcus/MEMORY.md',
  'diana-coo':          'agent-department/COO/diana/MEMORY.md',
  'dev-lead':           'agent-department/Technical/dev/MEMORY.md',
  'raj-backend':        'agent-department/Technical/raj/MEMORY.md',
  'mia-frontend':       'agent-department/Technical/mia/MEMORY.md',
  'quinn-qa':           'agent-department/Technical/quinn/MEMORY.md',
  'lena-brand':         'agent-department/Marketing/lena/MEMORY.md',
  'rio-ads':            'agent-department/Marketing/rio/MEMORY.md',
  'atlas-art-director': 'agent-department/Marketing/atlas/MEMORY.md',
  'pixel-production':   'agent-department/Marketing/pixel/MEMORY.md',
  'kai-analyst':        'agent-department/Marketing/kai/MEMORY.md',
  'nate-growth':        'agent-department/Marketing/nate/MEMORY.md',
  'felix-finance':      'agent-department/Finance/felix/MEMORY.md',
  'daniel-kahneman':    'agent-department/Psychology/Daniel_Kahneman/MEMORY.md',
}

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  let upserts = 0
  let skipped = 0
  for (const [agentId, relPath] of Object.entries(AGENT_MEMORY_PATHS)) {
    const file = join(process.cwd(), relPath)
    let content
    try { content = readFileSync(file, 'utf8') }
    catch { console.log(`  ⏭  ${agentId.padEnd(22)}: no file at ${relPath}`); skipped++; continue }

    const { error } = await sb
      .from('agent_memory')
      .upsert(
        { agent_id: agentId, content, updated_at: new Date().toISOString() },
        { onConflict: 'agent_id' },
      )

    if (error) { console.log(`  ✗ ${agentId}: ${error.message}`); process.exit(2) }
    console.log(`  ✓ ${agentId.padEnd(22)} ${content.length} chars`)
    upserts++
  }
  console.log(`\nDone — ${upserts} upserted, ${skipped} skipped.`)
}

main().catch(e => { console.error(e); process.exit(1) })
