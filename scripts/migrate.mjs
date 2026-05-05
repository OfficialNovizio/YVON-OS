/**
 * YVON Automatic Migration Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads all .sql files from supabase/migrations/, tracks which ones have
 * already been applied in a _migrations table, and runs only the new ones.
 *
 * Requires: DATABASE_URL env var (Supabase > Settings > Database > URI)
 *
 * Usage:
 *   npm run db:migrate          — run from local terminal
 *   Vercel build command:       — runs automatically before every deploy
 *     node scripts/migrate.mjs && next build
 */

import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const { Client } = pg
const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '../supabase/migrations')

// ─── Load env vars ────────────────────────────────────────────────────────────
// In Vercel these come from env. Locally, load from .env.local if present.

function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8')
    for (const line of envFile.split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // No .env.local — fine in Vercel (env vars injected directly)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function migrate() {
  loadEnv()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL is not set — skipping migrations.')
    console.warn('   Get it from: Supabase → Settings → Database → Connection string → URI')
    console.warn('   Add it to .env.local for local use, and to Vercel env vars for production.')
    process.exit(0)  // Exit 0 so build doesn't fail when var is missing
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Connected to database')

  // Create migrations tracking table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Load already-applied migrations
  const { rows } = await client.query('SELECT name FROM _migrations ORDER BY name')
  const applied = new Set(rows.map(r => r.name))

  // Load migration files in order
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log(`\n📦 Found ${files.length} migration files, ${applied.size} already applied\n`)

  let ran = 0
  let skipped = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭  ${file} — already applied`)
      skipped++
      continue
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8')
    console.log(`▶  ${file} — running...`)

    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      console.log(`✓  ${file} — done`)
      ran++
    } catch (err) {
      console.error(`❌ ${file} — FAILED`)
      console.error(`   ${err.message}`)
      await client.end()
      process.exit(1)
    }
  }

  await client.end()

  console.log(`\n─────────────────────────────────────────`)
  console.log(`Migration complete: ${ran} applied, ${skipped} skipped`)
  console.log(`─────────────────────────────────────────\n`)
}

migrate().catch(err => {
  console.error('Fatal migration error:', err.message)
  process.exit(1)
})
