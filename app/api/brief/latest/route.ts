// GET /api/brief/latest
// Returns the most recent Marcus brief for the active venture (read-only).
// Briefs are generated + persisted by the cron-gated /api/briefing route.

import { cookies } from 'next/headers'
import { getVentureBySlug, getBriefs } from '@/lib/db'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  try {
    const venture = await getVentureBySlug(slug)
    const ventureId = venture?.id ?? slug
    const briefs = await getBriefs(ventureId)
    const latest = briefs[0] ?? null
    return Response.json({
      brief: latest ? { id: latest.id, content: latest.content, date: latest.date } : null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
