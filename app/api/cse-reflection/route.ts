// CSE Reflection Cron — runs weekly on Monday at 08:00 UTC
// Analyses signal_reliability trends and proposes weight adjustments when confidence is low.
// Proposals go into scoring_weight_history with status='pending' — user approves or rejects.
// Engine NEVER auto-applies weights. Every change requires explicit user approval.

import { supabase } from '@/lib/supabase'

export const maxDuration = 60

const VENTURES = ['novizio', 'hourbour']
const DEFAULT_WEIGHTS = { E: 0.25, R: 0.25, G: 0.20, B: 0.15, T: 0.15 }

// Maps signal_type → weight factor it most affects
const SIGNAL_WEIGHT_MAP: Record<string, keyof typeof DEFAULT_WEIGHTS> = {
  GAP_OPPORTUNITY: 'G',
  PROVEN_FORMAT:   'E',
  SEO_WINDOW:      'R',
  URGENCY_WINDOW:  'T',
  FUNNEL_FIX:      'E',
}

export async function GET(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ venture: string; proposed: boolean; reason?: string }> = []

  for (const slug of VENTURES) {
    // Check cooldown — skip if a proposal was rejected < 14 days ago
    const { data: recentRejected } = await supabase
      .from('scoring_weight_history')
      .select('cooldown_until')
      .eq('venture_slug', slug)
      .eq('status', 'rejected')
      .gt('cooldown_until', new Date().toISOString())
      .limit(1)

    if (recentRejected && recentRejected.length > 0) {
      results.push({ venture: slug, proposed: false, reason: 'cooldown active' })
      continue
    }

    // Skip if there's already a pending proposal
    const { data: pending } = await supabase
      .from('scoring_weight_history')
      .select('id')
      .eq('venture_slug', slug)
      .eq('status', 'pending')
      .limit(1)

    if (pending && pending.length > 0) {
      results.push({ venture: slug, proposed: false, reason: 'pending proposal exists' })
      continue
    }

    // Get signal reliability scores — look for low-confidence signals (≥5 pitches, <40% score)
    const { data: signals } = await supabase
      .from('signal_reliability')
      .select('signal_type, total_pitches, reliability_score')
      .eq('venture_slug', slug)
      .gte('total_pitches', 5)
      .lt('reliability_score', 40)

    if (!signals || signals.length === 0) {
      results.push({ venture: slug, proposed: false, reason: 'no low-confidence signals' })
      continue
    }

    // Find the worst-performing signal type
    const worst = signals.reduce((a, b) =>
      (a.reliability_score as number) < (b.reliability_score as number) ? a : b
    )

    const signalType = worst.signal_type as string
    const affectedWeight = SIGNAL_WEIGHT_MAP[signalType] ?? 'G'

    // Get current active weights
    const { data: activeWeight } = await supabase
      .from('scoring_weight_history')
      .select('weights, version')
      .eq('venture_slug', slug)
      .eq('status', 'approved')
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const current: Record<string, number> = (activeWeight?.weights as Record<string, number>) ?? { ...DEFAULT_WEIGHTS }
    const currentVersion: number = (activeWeight?.version as number) ?? 0

    // Propose: reduce the low-reliability weight by 5pp, redistribute to next best
    const delta = 0.05
    const proposed = { ...current }
    proposed[affectedWeight] = Math.max(0.05, (proposed[affectedWeight] ?? 0) - delta)

    // Redistribute to E (engagement) as the most universal positive signal
    const redistribute = affectedWeight === 'E' ? 'R' : 'E'
    proposed[redistribute] = Math.min(0.50, (proposed[redistribute] ?? 0) + delta)

    const reliabilityPct = Math.round(worst.reliability_score as number)
    const pitchCount = worst.total_pitches as number

    const { error } = await supabase.from('scoring_weight_history').insert({
      venture_slug:  slug,
      version:       currentVersion + 1,
      weights:       proposed,
      reason:        `${signalType} signal is underperforming at ${reliabilityPct}% reliability over ${pitchCount} pitches. Reducing its weight factor (${affectedWeight}) by 5pp and redistributing to ${redistribute}.`,
      trigger_data:  `${signalType} reliability=${reliabilityPct}% pitches=${pitchCount} threshold=40%`,
      status:        'pending',
    })

    results.push({
      venture: slug,
      proposed: !error,
      reason: error ? error.message : `${signalType} → reduce ${affectedWeight} by 5pp`,
    })
  }

  return Response.json({ ok: true, results, ranAt: new Date().toISOString() })
}
