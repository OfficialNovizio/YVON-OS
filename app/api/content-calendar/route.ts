import { getContentCalendar, createContentCalendarEntry, deleteContentCalendarEntry, getPostedEntries, getMissedEntries, replanEntry, skipEntry } from '@/lib/db'
import type { CalendarContentType, CalendarPlatform } from '@/lib/types'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const zone = searchParams.get('zone') ?? 'upcoming'

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  if (zone === 'missed') {
    const entries = await getMissedEntries(ventureId)
    return Response.json({ entries })
  }

  if (zone === 'posted') {
    if (!month) return Response.json({ error: 'month param required for posted zone' }, { status: 400 })
    const entries = await getPostedEntries(ventureId, month)
    return Response.json({ entries })
  }

  // Default: upcoming
  if (!month) return Response.json({ error: 'month param required (YYYY-MM)' }, { status: 400 })
  const entries = await getContentCalendar(ventureId, month)
  return Response.json({ entries })
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { planDate: string; contentType: string; platform: string; headline?: string; brief?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.planDate || !body.contentType || !body.platform) {
    return Response.json({ error: 'planDate, contentType, platform required' }, { status: 400 })
  }

  const entry = await createContentCalendarEntry({
    ventureId,
    planDate: body.planDate,
    contentType: body.contentType as CalendarContentType,
    platform: body.platform as CalendarPlatform,
    headline: body.headline,
    brief: body.brief,
    status: 'planned',
  })

  return Response.json({ entry })
}

export async function PATCH(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { action: string; id?: string; missedId?: string; newDate?: string; status?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action === 'update_status' && body.id && body.status) {
    const { error } = await supabase
      .from('content_calendar')
      .update({ status: body.status })
      .eq('id', body.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  if (body.action === 'skip' && body.id) {
    await skipEntry(body.id)
    return Response.json({ ok: true })
  }

  if (body.action === 'replan' && body.missedId && body.newDate) {
    const { data } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', body.missedId)
      .single()

    if (!data) return Response.json({ error: 'Entry not found' }, { status: 404 })

    const entry = await replanEntry(
      body.missedId,
      body.newDate,
      ventureId,
      data.content_type,
      data.platform,
      data.headline ?? undefined,
      data.brief ?? undefined,
    )
    return Response.json({ entry })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id param required' }, { status: 400 })

  await deleteContentCalendarEntry(id)
  return Response.json({ ok: true })
}
