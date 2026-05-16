// PATCH /api/content-series/[id] — update a series
// DELETE /api/content-series/[id] — remove a series

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { updateContentSeries, deleteContentSeries } from '@/lib/content-series'
import type { ContentSeries } from '@/lib/types'

async function getVentureId(): Promise<string> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { data } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  return (data?.id as string | undefined) ?? slug
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const ventureId = await getVentureId()

  let body: Partial<Omit<ContentSeries, 'id' | 'ventureId' | 'createdAt' | 'updatedAt'>>
  try { body = await request.json() as typeof body }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  try {
    const updated = await updateContentSeries(id, ventureId, body)
    return Response.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const ventureId = await getVentureId()
  await deleteContentSeries(id, ventureId)
  return new Response(null, { status: 204 })
}
