// Content Series API — CRUD for the venture's repeatable content series
// GET  — list all series for active venture
// POST — create a new series
// PATCH /api/content-series/[id] — update
// DELETE /api/content-series/[id] — delete

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { getContentSeries, createContentSeries, seedDefaultSeries } from '@/lib/content-series'
import type { ContentSeries } from '@/lib/types'

async function getVentureId(): Promise<string> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { data } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  return (data?.id as string | undefined) ?? slug
}

export async function GET(): Promise<Response> {
  const ventureId = await getVentureId()

  // Auto-seed defaults on first load
  await seedDefaultSeries(ventureId)

  const series = await getContentSeries(ventureId)
  return Response.json({ ventureId, series })
}

export async function POST(request: Request): Promise<Response> {
  const ventureId = await getVentureId()

  let body: Omit<ContentSeries, 'id' | 'ventureId' | 'createdAt' | 'updatedAt'>
  try { body = await request.json() as typeof body }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name?.trim()) return Response.json({ error: 'name is required' }, { status: 400 })

  try {
    const created = await createContentSeries(ventureId, {
      name:        body.name.trim(),
      description: body.description ?? '',
      format:      body.format      ?? 'reel',
      frequency:   body.frequency   ?? 'weekly',
      platform:    body.platform    ?? 'instagram',
      fanGoal:     body.fanGoal     ?? 'advocate',
      active:      body.active      ?? true,
      sortOrder:   body.sortOrder   ?? 99,
    })
    return Response.json(created, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
