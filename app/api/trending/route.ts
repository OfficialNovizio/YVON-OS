import { callFast } from '@/lib/ai-client'
import { runWebScraper } from '@/lib/apify'
import { upsertTrendingItem } from '@/lib/db'

export const maxDuration = 30
import type { TrendItem } from '@/lib/types'

// Keywords to scrape — update these for your niche
const NICHE_URLS = [
  'https://trends.google.com/trends/explore?q=small+business+marketing',
  'https://www.reddit.com/r/smallbusiness/top/?t=day',
]

export async function GET(request: Request): Promise<Response> {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN must be set' }, { status: 500 })
  }

  const url = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''

  try {
    const scrapedTexts = await Promise.allSettled(
      NICHE_URLS.map((u) => runWebScraper(u))
    )
    const combined = scrapedTexts
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value)
      .join('\n\n')
      .slice(0, 6000)

    if (!combined.trim()) {
      return Response.json({ trends: [], generatedAt: new Date().toISOString() })
    }

    const rawText = await callFast({
      messages: [{
        role: 'user',
        content: `Based on the following scraped content, identify the top 8 trending topics with the most viral potential for a business audience.

For each topic return a JSON array item with: keyword, angle (1 sentence on why it's viral), platform (instagram/youtube/linkedin/all).

Respond with ONLY a JSON array, no other text.

Content:
${combined}`,
      }],
      maxTokens: 1024,
    })

    let parsed: Array<{ keyword: string; angle: string; platform: string }> = []
    try {
      parsed = JSON.parse(rawText) as typeof parsed
    } catch {
      parsed = []
    }

    const trends: TrendItem[] = parsed.map((item) => ({
      id: crypto.randomUUID(),
      keyword: item.keyword ?? '',
      angle: item.angle ?? '',
      platform: (['instagram', 'youtube', 'linkedin', 'all'].includes(item.platform)
        ? item.platform
        : 'all') as TrendItem['platform'],
      status: 'new',
      generatedAt: new Date().toISOString(),
    }))

    if (ventureId) {
      await Promise.allSettled(
        trends.map((item) => upsertTrendingItem(ventureId, item))
      )
    }

    return Response.json({ trends, generatedAt: new Date().toISOString() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
