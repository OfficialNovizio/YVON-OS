/**
 * POST /api/competitor-pipeline
 * Runs the full competitor pipeline: discover → scrape → score → store.
 *
 * Body: { ventureSlug, competitors: [{ brandName, url?, handles? }] }
 * Returns: PipelineResult[] — per-competitor scrape results with scores
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runCompetitorPipeline } from '@/lib/competitor-pipeline'

export const runtime = 'nodejs'
export const maxDuration = 180

export async function POST(req: NextRequest) {
  let body: {
    ventureSlug?: string
    competitors: Array<{ brandName: string; url?: string; tier?: string; handles?: Array<{ platform: string; handle: string }> }>
  }
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureSlug, competitors = [] } = body
  if (!ventureSlug) {
    return NextResponse.json({ error: 'Missing ventureSlug' }, { status: 400 })
  }
  if (!Array.isArray(competitors) || competitors.length === 0) {
    return NextResponse.json({ error: 'Missing competitors array' }, { status: 400 })
  }
  if (competitors.length > 10) {
    return NextResponse.json({ error: 'Max 10 competitors per run' }, { status: 400 })
  }

  // Resolve venture
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id')
    .eq('slug', ventureSlug)
    .limit(1)

  const ventureId = (ventures?.[0] as any)?.id
  if (!ventureId) {
    return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
  }

  // Run pipeline
  const typedCompetitors = competitors.map(c => ({
    brandName: c.brandName,
    url: c.url,
    tier: (c.tier ?? 'benchmark') as 'benchmark' | 'stretch' | 'anchor',
    handles: (c.handles ?? []).map(h => ({
      platform: h.platform as 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
      handle: h.handle,
    })),
  }))

  try {
    const results = await runCompetitorPipeline(ventureId, typedCompetitors)
    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[competitor-pipeline]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
