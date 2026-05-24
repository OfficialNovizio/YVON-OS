import { getCompetitorContent, upsertCompetitorContent, insertCompetitorSnapshot } from '@/lib/db'
import { getSecret } from '@/lib/secrets'

const CACHE_DAYS = 14

export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? 'novizio'
  const platform  = url.searchParams.get('platform') ?? 'instagram'

  try {
    const cached = await getCompetitorContent(ventureId, platform)

    // Check if cache is fresh (< CACHE_DAYS old)
    if (cached.length > 0) {
      const lastFetch = new Date(cached[0].fetchedAt).getTime()
      const ageMs = Date.now() - lastFetch
      const ageDays = ageMs / (1000 * 60 * 60 * 24)
      if (ageDays < CACHE_DAYS) {
        return Response.json(cached)
      }
    }

    // No fresh cache — return whatever we have (or empty)
    // Actual scraping is done via the cron job (POST below)
    return Response.json(cached)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// Called by Vercel Cron (Monday 8am UTC) to refresh competitor content
export async function POST(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (cronSecret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { ventureId?: string; platform?: string; competitorUrl?: string; items?: Array<Record<string, string>> }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId = 'novizio', platform = 'instagram', competitorUrl, items = [] } = body

  if (items.length === 0) {
    return Response.json({ stored: 0 })
  }

  try {
    const now = new Date().toISOString()
    await upsertCompetitorContent(
      items.map((item) => ({
        ventureId,
        platform: platform as 'instagram' | 'linkedin',
        title: item.title,
        description: item.description,
        engagementHint: item.engagementHint,
        sourceUrl: item.sourceUrl,
        fetchedAt: now,
      }))
    )
    // Append-only snapshot for growth tracking (non-fatal)
    try {
      await insertCompetitorSnapshot(
        ventureId,
        platform,
        { items, fetchedAt: now } as Record<string, unknown>,
        competitorUrl ?? items[0]?.sourceUrl
      )
    } catch { /* snapshot failure must not fail the response */ }
    return Response.json({ stored: items.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
