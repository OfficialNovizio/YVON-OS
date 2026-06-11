import { getActivityFeed } from '@/lib/db'
import type { ActivityEvent } from '@/lib/types'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const ventureId = searchParams.get('ventureId') ?? 'novizio'
  const limit = parseInt(searchParams.get('limit') ?? '50', 10)

  try {
    const events = await getActivityFeed(ventureId, limit)
    return Response.json({ logs: events, source: 'live' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ logs: [], source: 'error', error: msg }, { status: 200 })
  }
}
