import { getChannelStats } from '@/lib/youtube'
import { setSocialStats, insertSocialSnapshot, getSocialStats } from '@/lib/db'

// GET — return cached YouTube stats for the active venture (read-only, no auth required)
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const ventureId = searchParams.get('ventureId') ?? 'novizio'

  try {
    const stats = await getSocialStats(ventureId, 'youtube')
    if (!stats) {
      return Response.json({
        subscribers: 0, totalViews: 0, videoCount: 0, latestVideos: [],
        source: 'empty',
      })
    }
    return Response.json({ ...stats, source: 'live' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, source: 'error' }, { status: 200 })
  }
}

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
