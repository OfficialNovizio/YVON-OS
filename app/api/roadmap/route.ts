import { supabase } from '@/lib/supabase'
import type { RoadmapItem, RoadmapStatus } from '@/lib/types'

export async function GET(): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error

    const items: RoadmapItem[] = (data ?? []).map(row => ({
      id: row.id as string,
      title: row.title as string,
      priority: row.priority as string,
      status: row.status as RoadmapStatus,
      dri: (row.dri as string | null) ?? undefined,
      notes: (row.notes as string | null) ?? undefined,
      updatedAt: row.updated_at as string,
    }))

    return Response.json({ items })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string; status?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.status) {
    return Response.json({ error: 'id and status are required' }, { status: 400 })
  }

  const valid: RoadmapStatus[] = ['scoped', 'in-flight', 'shipped']
  if (!valid.includes(body.status as RoadmapStatus)) {
    return Response.json({ error: 'status must be scoped, in-flight, or shipped' }, { status: 400 })
  }

  try {
    await supabase
      .from('roadmap_items')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.id)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
