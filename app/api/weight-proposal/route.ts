// Weight Proposal — manages scoring weight change proposals from the self-learning engine
// GET  → pending proposals + currently active weights for the active venture
// POST → approve or reject a proposal (user action only — engine never auto-applies weights)

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

interface WeightRecord {
  id: string
  venture_slug: string
  version: number
  weights: Record<string, number>
  reason: string
  trigger_data: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  cooldown_until: string | null
  created_at: string
}

const DEFAULT_WEIGHTS = { E: 0.25, R: 0.25, G: 0.20, B: 0.15, T: 0.15 }

// ── GET — pending proposals + active weights ───────────────────────────────────
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const [{ data: pending, error: pendingErr }, { data: active }] = await Promise.all([
    supabase
      .from('scoring_weight_history')
      .select('*')
      .eq('venture_slug', slug)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),

    supabase
      .from('scoring_weight_history')
      .select('*')
      .eq('venture_slug', slug)
      .eq('status', 'approved')
      .order('version', { ascending: false })
      .limit(1)
      .single(),
  ])

  if (pendingErr) return Response.json({ error: pendingErr.message }, { status: 500 })

  const activeRecord = active as WeightRecord | null

  return Response.json({
    pending: (pending ?? []) as WeightRecord[],
    activeWeights: activeRecord?.weights ?? DEFAULT_WEIGHTS,
    activeVersion: activeRecord?.version ?? 0,
  })
}

// ── POST — approve or reject ───────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  interface Body {
    proposalId: string
    action: 'approve' | 'reject'
    rejectReason?: string
  }

  let body: Body
  try { body = await request.json() as Body }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.proposalId || !body.action) {
    return Response.json({ error: 'proposalId and action required' }, { status: 400 })
  }
  if (body.action !== 'approve' && body.action !== 'reject') {
    return Response.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {
    status: body.action === 'approve' ? 'approved' : 'rejected',
    approved_by: 'user',
  }

  if (body.action === 'reject') {
    // 14-day cooldown: engine won't re-propose the same weight class for 14 days
    updates.cooldown_until = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    if (body.rejectReason) updates.reason = body.rejectReason
  }

  const { data, error } = await supabase
    .from('scoring_weight_history')
    .update(updates)
    .eq('id', body.proposalId)
    .eq('venture_slug', slug)   // scope to active venture — never update another venture's proposals
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true, record: data })
}
