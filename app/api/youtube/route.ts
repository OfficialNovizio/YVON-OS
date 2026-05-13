import { getChannelStats } from '@/lib/youtube'
import { setSocialStats, insertSocialSnapshot } from '@/lib/db'

export async function POST(request: Request): Promise<Response> {
  if (!process.env.YOUTUBE_API_KEY) {
    return Response.json({ error: 'YOUTUBE_API_KEY not set' }, { status: 500 })
  }

  let channelId: string
  let ventureId: string
  try {
    const body = await request.json() as { channelId?: string; ventureId?: string }
    channelId = body.channelId ?? ''
    ventureId = body.ventureId ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!channelId) {
    return Response.json({ error: 'channelId is required' }, { status: 400 })
  }

  try {
    const stats = await getChannelStats(channelId)
    if (ventureId) {
      await setSocialStats(ventureId, 'youtube', stats)
      // Append-only snapshot for growth tracking (non-fatal)
      try {
        await insertSocialSnapshot(ventureId, 'youtube', stats as unknown as Record<string, unknown>)
      } catch { /* snapshot failure must not fail the response */ }
    }
    return Response.json(stats)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
