/**
 * /api/custom-competitor
 * Manage manually pinned competitor brands (added from Settings).
 *
 * GET  ?venture=novizio          → list custom competitors for a venture
 * POST { ventureSlug, brandName } → add brand, run pipeline, return result
 * DELETE ?venture=novizio&id=<uuid> → remove a custom competitor
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { runCompetitorPipeline } from '@/lib/competitor-pipeline'

export const runtime = 'nodejs'
export const maxDuration = 180

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('venture')
  if (!slug) return NextResponse.json({ error: 'Missing venture param' }, { status: 400 })

  const { data: ventures } = await supabase
    .from('ventures').select('id').eq('slug', slug).limit(1)
  const ventureId = (ventures?.[0] as any)?.id
  if (!ventureId) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const { data: competitors } = await supabase
    .from('competitors')
    .select('id, brand_name, tier, signal_score, last_checked, is_custom')
    .eq('venture_id', ventureId)
    .eq('is_custom', true)
    .order('brand_name')

  return NextResponse.json({ competitors: competitors ?? [] })
}

export async function POST(req: NextRequest) {
  let body: { ventureSlug?: string; brandName?: string }
  try { body = await req.json() as typeof body }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { ventureSlug, brandName } = body
  if (!ventureSlug || !brandName?.trim()) {
    return NextResponse.json({ error: 'ventureSlug and brandName are required' }, { status: 400 })
  }

  const { data: ventures } = await supabase
    .from('ventures').select('id').eq('slug', ventureSlug).limit(1)
  const ventureId = (ventures?.[0] as any)?.id
  if (!ventureId) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const name = brandName.trim()

  try {
    const results = await runCompetitorPipeline(ventureId, [{
      brandName: name,
      tier: 'benchmark',
      isCustom: true,
    }])

    const { data: comp } = await supabase
      .from('competitors')
      .select('id, brand_name, tier, signal_score, last_checked, is_custom')
      .eq('venture_id', ventureId)
      .eq('brand_name', name)
      .limit(1)

    return NextResponse.json({
      competitor: (comp?.[0] as any) ?? { brand_name: name, tier: 'benchmark', is_custom: true },
      pipelineResult: results[0] ?? null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[custom-competitor POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('venture')
  const id   = req.nextUrl.searchParams.get('id')
  if (!slug || !id) {
    return NextResponse.json({ error: 'Missing venture or id param' }, { status: 400 })
  }

  const { data: ventures } = await supabase
    .from('ventures').select('id').eq('slug', slug).limit(1)
  const ventureId = (ventures?.[0] as any)?.id
  if (!ventureId) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  await supabase
    .from('competitors')
    .delete()
    .eq('id', id)
    .eq('venture_id', ventureId)

  return NextResponse.json({ ok: true })
}
