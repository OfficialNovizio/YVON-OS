// Signal Reliability — tracks how trustworthy each signal source is over time
// GET   → current reliability scores for the active venture
// PATCH → update scores after a measurement cycle (called by content-performance PATCH)

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

// ── GET — current reliability scores ─────────────────────────────────────────
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { data, error } = await supabase
    .from('signal_reliability')
    .select('*')
    .eq('venture_slug', slug)
    .order('reliability_score', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Flag signal types with < 40% reliability over ≥ 5 data points as "low confidence"
  const scored = (data ?? []).map((r: {
    signal_type: string
    signal_source: string
    total_pitches: number
    overperformed: number
    met_expectations: number
    underperformed: number
    reliability_score: number
    last_updated: string
  }) => ({
    ...r,
    lowConfidence: r.total_pitches >= 5 && r.reliability_score < 40,
    hasEnoughData: r.total_pitches >= 5,
  }))

  return Response.json({ reliability: scored })
}

// ── PATCH — manual update to a signal's reliability score ─────────────────────
export async function PATCH(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  interface PatchBody {
    signalType:   string
    signalSource: string
    outcome:      'overperformed' | 'met' | 'underperformed'
  }

  let body: PatchBody
  try { body = await request.json() as PatchBody }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.signalType || !body.signalSource || !body.outcome) {
    return Response.json({ error: 'signalType, signalSource, outcome required' }, { status: 400 })
  }

  // Upsert the row
  const { data: existing } = await supabase
    .from('signal_reliability')
    .select('*')
    .eq('venture_slug', slug)
    .eq('signal_type', body.signalType)
    .eq('signal_source', body.signalSource)
    .single()

  const total       = (existing?.total_pitches     ?? 0) + 1
  const over        = (existing?.overperformed      ?? 0) + (body.outcome === 'overperformed' ? 1 : 0)
  const met         = (existing?.met_expectations   ?? 0) + (body.outcome === 'met'           ? 1 : 0)
  const under       = (existing?.underperformed     ?? 0) + (body.outcome === 'underperformed' ? 1 : 0)

  // Reliability score = weighted: over=100, met=60, under=0
  const reliability = total > 0
    ? Math.round(((over * 100) + (met * 60) + (under * 0)) / total)
    : 50

  const { data, error } = await supabase
    .from('signal_reliability')
    .upsert({
      venture_slug:    slug,
      signal_type:     body.signalType,
      signal_source:   body.signalSource,
      total_pitches:   total,
      overperformed:   over,
      met_expectations: met,
      underperformed:  under,
      reliability_score: reliability,
      last_updated:    new Date().toISOString(),
    }, { onConflict: 'venture_slug,signal_type,signal_source' })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // If reliability < 40 AND ≥ 5 data points — check if we should propose a weight change
  const shouldPropose = total >= 5 && reliability < 40

  return Response.json({ record: data, reliability, shouldPropose })
}
