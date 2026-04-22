import { runInstagramScraper } from '@/lib/apify'
import { setSocialStats } from '@/lib/db'

export async function POST(request: Request): Promise<Response> {
  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN not set' }, { status: 500 })
  }

  let handle: string
  let ventureId: string
  try {
    const body = await request.json() as { handle?: string; ventureId?: string }
    handle = body.handle?.replace('@', '') ?? ''
    ventureId = body.ventureId ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!handle) {
    return Response.json({ error: 'handle is required' }, { status: 400 })
  }

  try {
    const stats = await runInstagramScraper(handle)
    if (ventureId) {
      await setSocialStats(ventureId, 'instagram', stats)
    }
    return Response.json(stats)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
