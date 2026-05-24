#!/usr/bin/env node
/**
 * One-shot data migration: reads docs/ventures/[slug]/{CONTEXT,BRAND,DESIGN,FEEDBACK}.md
 * and upserts each into the venture_documents table.
 *
 * Idempotent. Safe to re-run — uses ON CONFLICT (venture_slug, doc_type) DO UPDATE.
 *
 * Run: node --env-file=.env.local scripts/migrate-venture-docs-to-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const ROOT = join(process.cwd(), 'docs', 'ventures')
const DOC_TYPES = ['context', 'brand', 'design', 'feedback']

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const entries = readdirSync(ROOT)
  let upserts = 0
  let skipped = 0
  for (const slug of entries) {
    const dir = join(ROOT, slug)
    if (!statSync(dir).isDirectory()) continue
    if (slug === 'INDEX.md') continue
    console.log(`\n▶ ${slug}`)

    for (const docType of DOC_TYPES) {
      const file = join(dir, `${docType.toUpperCase()}.md`)
      let content
      try { content = readFileSync(file, 'utf8') }
      catch { console.log(`  ⏭  ${docType}: no file at ${file}`); skipped++; continue }

      const { error } = await sb
        .from('venture_documents')
        .upsert(
          { venture_slug: slug, doc_type: docType, content, updated_at: new Date().toISOString() },
          { onConflict: 'venture_slug,doc_type' },
        )

      if (error) { console.log(`  ✗ ${docType}: ${error.message}`); process.exit(2) }
      console.log(`  ✓ ${docType}: ${content.length} chars`)
      upserts++
    }
  }

  console.log(`\nDone — ${upserts} upserted, ${skipped} skipped.`)

  // Verify
  const { data, error } = await sb
    .from('venture_documents')
    .select('venture_slug, doc_type, length(content) as len')
    .order('venture_slug, doc_type')
  if (error) { console.error('verify error:', error.message); process.exit(2) }
  console.log('\nDB now contains:')
  for (const r of data ?? []) console.log(`  ${r.venture_slug} / ${r.doc_type}`)
}

main().catch(e => { console.error(e); process.exit(1) })
