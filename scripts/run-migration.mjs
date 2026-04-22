import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read env from .env.local
const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const supabaseUrl  = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey   = env.SUPABASE_SERVICE_ROLE_KEY
const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

// Read SQL file and strip comments
const rawSql = readFileSync(join(__dirname, '../supabase/migrations/001_phase3_tables.sql'), 'utf8')

// Run each statement via the PostgREST /rpc approach won't work for DDL,
// so we use the Supabase Management API (requires PAT) or fall back to
// running statements one-by-one via the service role + supabase-js workaround.

// Try the Management API endpoint (works if user has a PAT set as env var)
const pat = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN

async function runViaManagementAPI() {
  const url = `https://api.supabase.com/v1/projects/${ref}/database/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: rawSql }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

async function runViaSupabaseClient() {
  // Use the supabase-js client with the service role key
  // We can execute SQL through the pgmeta endpoint that Supabase exposes
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: rawSql }),
  })
  if (res.status === 404) throw new Error('exec_sql function not available')
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  return data
}

async function runViaPgMeta() {
  // Supabase exposes pg-meta at /pg/query for internal use
  const url = `${supabaseUrl}/pg/query`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: rawSql }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`${res.status}: ${txt.slice(0, 200)}`)
  }
  return res.json()
}

async function main() {
  console.log(`Project ref: ${ref}`)

  if (pat) {
    console.log('Trying Management API (PAT)...')
    try {
      const r = await runViaManagementAPI()
      console.log('✅ Migration complete via Management API', r)
      return
    } catch (e) {
      console.log('Management API failed:', e.message)
    }
  }

  console.log('Trying pg-meta endpoint...')
  try {
    const r = await runViaPgMeta()
    console.log('✅ Migration complete via pg-meta', JSON.stringify(r).slice(0, 100))
    return
  } catch (e) {
    console.log('pg-meta failed:', e.message)
  }

  console.log('Trying exec_sql RPC...')
  try {
    const r = await runViaSupabaseClient()
    console.log('✅ Migration complete via exec_sql RPC', r)
    return
  } catch (e) {
    console.log('exec_sql RPC failed:', e.message)
  }

  console.log('\n❌ All remote methods failed.')
  console.log('Please provide your Supabase DB password (Settings → Database → Connection string)')
  console.log('Then run: SUPABASE_DB_PASSWORD=your_password node scripts/run-migration.mjs')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
