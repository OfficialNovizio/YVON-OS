import { runLinkedInScraper } from '@/lib/apify'
import { setSocialStats } from '@/lib/db'

export async function POST(request: Request): Promise<Response> {
  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN not set' }, { status: 500 })
  }

  let profileUrl: string
  let ventureId: string
  try {
    const body = await request.json() as { profileUrl?: string; ventureId?: string }
    profileUrl = body.profileUrl ?? ''
    ventureId = body.ventureId ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!profileUrl) {
    return Response.json({ error: 'profileUrl is required' }, { status: 400 })
  }

  try {
    const stats = await runLinkedInScraper(profileUrl)
    if (ventureId) {
      await setSocialStats(ventureId, 'linkedin', stats)
    }
    return Response.json(stats)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
