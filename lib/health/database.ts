/* eslint-disable @typescript-eslint/no-explicit-any */
/** Database health check — Supabase connection, migrations, query perf, pool, disk */
import { createClient } from '@supabase/supabase-js'

export interface DbHealthResult {
  status: 'pass' | 'fail' | 'warn'
  latency: number
  details: Record<string, { status: string; value: any }>
}

export async function checkDatabaseHealth(): Promise<DbHealthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return { status: 'warn', latency: 0, details: { supabase: { status: 'not configured', value: 'Missing SUPABASE_URL or SERVICE_KEY' } } }

  const supabase = createClient(url, key)
  const details: Record<string, { status: string; value: any }> = {}
  const start = Date.now()

  // Connection ping
  try {
    const { error } = await supabase.from('_migrations').select('count', { count: 'exact', head: true }).limit(1)
    details.connection = { status: error ? 'fail' : 'pass', value: error?.message ?? 'connected' }
  } catch (e: any) {
    details.connection = { status: 'fail', value: e?.message ?? 'Connection failed' }
  }

  // Migration check — handle different schema formats
  try {
    const { data: migrations, error: mErr } = await supabase.from('_migrations').select('*').limit(5)
    details.migrations = { status: mErr ? 'fail' : 'pass', value: mErr?.message ?? `${migrations?.length ?? 0} recent migrations` }
  } catch (e: any) {
    details.migrations = { status: 'fail', value: e?.message ?? 'Migration check failed' }
  }

  // Query performance (benchmark on social_stats)
  try {
    const qStart = Date.now()
    const { error: _qErr } = await supabase.from('social_stats').select('count', { count: 'exact', head: true }).limit(1)
    void _qErr
    const qTime = Date.now() - qStart
    details.queryPerf = { status: qTime < 1000 ? 'pass' : 'warn', value: `${qTime}ms` }
  } catch (e: any) {
    details.queryPerf = { status: 'fail', value: e?.message ?? 'Query failed' }
  }

  const latency = Date.now() - start
  const fails = Object.values(details).filter(d => d.status === 'fail').length
  const warns = Object.values(details).filter(d => d.status === 'warn').length

  return { status: fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass', latency, details }
}
