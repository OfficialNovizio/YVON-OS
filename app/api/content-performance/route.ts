// Content Performance — records post outcomes and drives self-learning
// POST  → record a new post going live (links pitch → calendar entry)
// GET   → fetch posts pending measurement (measured_at IS NULL, posted >= 7d ago)
// PATCH → run measurement for a specific entry (manual "Measure Now" or cron T+7)

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

// ── Industry benchmarks (Stage 0 — no own history) ────────────────────────────
const BENCHMARKS: Record<string, Record<string, number>> = {
  novizio: {   // fashion DTC, 8K–12K follower cohort
    reel_eng:       4.2,
    carousel_eng:   2.8,
    static_eng:     1.1,
    reel_save:      1.8,
    carousel_save:  2.1,
    tiktok_watch:   12,
    conversion:     0.8,
  },
  hourbour: {  // fintech/neobank, 8K–12K follower cohort
    tiktok_short_eng: 5.1,
    carousel_eng:     3.2,
    linkedin_eng:     3.8,
    tiktok_watch:     18,
    conversion:       1.2,
  },
}

function classifyOutcome(
  actualEng: number | null,
  benchmarkEng: number | null,
  historicalAvg: number | null,
  hypothesisDirection: string | null,
  actualDelta: number,
): 'overperformed' | 'met' | 'underperformed' {
  if (actualEng === null || benchmarkEng === null) return 'met'

  const vsBenchmark = (actualEng / benchmarkEng) * 100
  const vsHistorical = historicalAvg ? (actualEng / historicalAvg) * 100 : 100

  if (vsBenchmark < 70 || vsHistorical < 60) return 'underperformed'
  if (vsBenchmark > 130 || actualDelta > 20) return 'overperformed'
  return 'met'
}

// ── POST — record post going live ─────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  interface PostBody {
    pitchId?: string
    calendarEntryId?: string
    platform: string
    format: string
    signalType?: string
    scoreAtSuggestion?: number
    scoreBreakdown?: Record<string, number>
    growthHypothesis?: string
    sourceSignals?: Record<string, unknown>
    postedAt?: string
  }

  let body: PostBody
  try { body = await request.json() as PostBody }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.platform || !body.format) {
    return Response.json({ error: 'platform and format required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('content_performance')
    .insert({
      venture_slug:        slug,
      pitch_id:            body.pitchId ?? null,
      calendar_entry_id:   body.calendarEntryId ?? null,
      platform:            body.platform,
      format:              body.format,
      signal_type:         body.signalType ?? null,
      score_at_suggestion: body.scoreAtSuggestion ?? null,
      score_breakdown:     body.scoreBreakdown ?? null,
      growth_hypothesis:   body.growthHypothesis ?? null,
      source_signals:      body.sourceSignals ?? null,
      posted_at:           body.postedAt ?? new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ record: data })
}

// ── GET — fetch posts pending measurement ─────────────────────────────────────
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Posts that went live ≥7 days ago and haven't been measured yet
  const { data: pending } = await supabase
    .from('content_performance')
    .select('*')
    .eq('venture_slug', slug)
    .is('measured_at', null)
    .lte('posted_at', sevenDaysAgo)
    .order('posted_at', { ascending: true })

  // Also fetch measured posts for the performance summary
  const { data: measured } = await supabase
    .from('content_performance')
    .select('id, platform, format, signal_type, outcome, outcome_delta, score_at_suggestion, measured_at')
    .eq('venture_slug', slug)
    .not('measured_at', 'is', null)
    .order('measured_at', { ascending: false })
    .limit(20)

  const measuredCount = measured?.length ?? 0
  const benchmarks = BENCHMARKS[slug] ?? BENCHMARKS.novizio
  const stage = measuredCount >= 5 ? 2 : measuredCount >= 1 ? 1 : 0

  return Response.json({
    pending: pending ?? [],
    measured: measured ?? [],
    measuredCount,
    stage,
    benchmarks,
    stageLabel: stage === 0
      ? 'Industry benchmarks only — no post history yet'
      : stage === 1
      ? `Low confidence — ${measuredCount} post${measuredCount > 1 ? 's' : ''} measured. Need 5+ for reliable signal.`
      : 'Own data active',
  })
}

// ── PATCH — run measurement (manual or cron T+7) ──────────────────────────────
export async function PATCH(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  interface PatchBody {
    recordId: string
    actualViews?: number
    actualLikes?: number
    actualComments?: number
    actualShares?: number
    actualSaves?: number
    actualReach?: number
    actualWatchTimeAvg?: number
    tierBenchmarkEngRate?: number
    historicalAvgEngRate?: number
    hypothesisDirection?: string   // 'up' | 'down' — was the IF direction correct?
  }

  let body: PatchBody
  try { body = await request.json() as PatchBody }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.recordId) return Response.json({ error: 'recordId required' }, { status: 400 })

  const interactions = (body.actualLikes ?? 0) + (body.actualComments ?? 0) +
    (body.actualShares ?? 0) + (body.actualSaves ?? 0)

  // Compute engagement rate proxy (interactions / reach)
  const actualEng = body.actualReach && interactions
    ? (interactions / body.actualReach) * 100
    : null

  const outcomeDelta = body.tierBenchmarkEngRate && actualEng
    ? ((actualEng - body.tierBenchmarkEngRate) / body.tierBenchmarkEngRate) * 100
    : 0

  const outcome = classifyOutcome(
    actualEng,
    body.tierBenchmarkEngRate ?? null,
    body.historicalAvgEngRate ?? null,
    body.hypothesisDirection ?? null,
    outcomeDelta,
  )

  const { data, error } = await supabase
    .from('content_performance')
    .update({
      measured_at:             new Date().toISOString(),
      actual_views:            body.actualViews ?? null,
      actual_likes:            body.actualLikes ?? null,
      actual_comments:         body.actualComments ?? null,
      actual_shares:           body.actualShares ?? null,
      actual_saves:            body.actualSaves ?? null,
      actual_reach:            body.actualReach ?? null,
      actual_watch_time_avg:   body.actualWatchTimeAvg ?? null,
      actual_interactions:     interactions || null,
      tier_benchmark_eng_rate: body.tierBenchmarkEngRate ?? null,
      historical_avg_eng_rate: body.historicalAvgEngRate ?? null,
      outcome,
      outcome_delta:           outcomeDelta,
    })
    .eq('id', body.recordId)
    .eq('venture_slug', slug)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // After measurement — update signal_reliability for the signal_type
  if (data?.signal_type) {
    await supabase.rpc('update_signal_reliability', {
      p_venture_slug:  slug,
      p_signal_type:   data.signal_type as string,
      p_signal_source: 'content_engine',
      p_outcome:       outcome,
    }).catch(() => null)  // non-fatal — table update, not critical path
  }

  return Response.json({ record: data, outcome, outcomeDelta })
}
