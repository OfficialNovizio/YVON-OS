/**
 * /api/kai-report
 * Generates or retrieves Kai intelligence reports.
 * Only returns real data from Supabase kai_reports table.
 * No fabricated reports. If no real data exists, returns an error.
 *
 * POST { venture, period }
 * GET  ?venture=novizio
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { venture?: string; period?: string }
  try {
    body = await req.json() as { venture?: string; period?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const venture = body.venture

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture' }, { status: 400 })
  }

  // Check if the venture has any social snapshots to base a report on
  const { count } = await supabase
    .from('social_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('venture_slug', venture)
    .gt('cache_expires_at', new Date().toISOString())

  if (!count || count === 0) {
    return NextResponse.json({
      error: 'no_data',
      message: 'No social data available to generate a report. Connect social accounts and fetch data first.',
    }, { status: 400 })
  }

  // No real report generation logic yet — needs Claude API integration
  // For now, return clear status
  return NextResponse.json({
    error: 'not_implemented',
    message: 'Report generation requires Claude API integration. Social data snapshots exist but report synthesis is pending.',
  }, { status: 501 })
}

export async function GET(req: NextRequest) {
  const venture = req.nextUrl.searchParams.get('venture')

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture' }, { status: 400 })
  }

  try {
    const { data } = await supabase
      .from('kai_reports')
      .select('*')
      .eq('venture_slug', venture)
      .order('generated_at', { ascending: false })
      .limit(10)

    const reports = (data ?? []).map(r => ({
      id: r.id,
      generatedAt: r.generated_at,
      venture: r.venture_name,
      period: r.period,
      summary: r.summary,
      situation: { title: r.situation_title, body: r.situation_body },
      diagnosis: { title: r.diagnosis_title, body: r.diagnosis_body },
      action: { title: r.action_title, body: r.action_body },
      prescription: { title: r.prescription_title, body: r.prescription_body },
      keyMetrics: r.key_metrics ?? [],
    }))

    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
