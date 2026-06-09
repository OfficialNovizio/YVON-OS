// GET /api/instagram/insights
// Fetches recent media + per-post Insights for the connected IG Business account.
// Returns the rich, owner-only metrics scrapers can't get: reach, views, saved,
// shares, total_interactions — plus likes/comments and a thumbnail.

import { getSecret } from '@/lib/secrets'

export const maxDuration = 60

const GRAPH = 'https://graph.facebook.com/v21.0'

interface IgInsightItem { name: string; values?: { value: number }[] }
interface IgMedia {
  id: string
  caption?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  like_count?: number
  comments_count?: number
  insights?: { data?: IgInsightItem[] }
}

export async function GET(): Promise<Response> {
  const token = await getSecret('instagram_graph_token')
  const igId = await getSecret('instagram_business_id')
  if (!token || !igId) {
    return Response.json({ error: 'Instagram not connected. Connect it in Settings → Venture.' }, { status: 400 })
  }

  const fields =
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,' +
    'insights.metric(reach,saved,shares,total_interactions,views)'
  const url = `${GRAPH}/${igId}/media?fields=${encodeURIComponent(fields)}&limit=12&access_token=${token}`

  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    return Response.json({ error: `Graph API error: ${body.slice(0, 300)}` }, { status: 502 })
  }

  const json = (await res.json()) as { data?: IgMedia[] }
  const posts = (json.data ?? []).map(m => {
    const ins: Record<string, number> = {}
    for (const it of m.insights?.data ?? []) ins[it.name] = it.values?.[0]?.value ?? 0
    return {
      id: m.id,
      caption: m.caption ?? '',
      mediaType: m.media_type ?? '',
      thumbnail: m.thumbnail_url || m.media_url || '',
      permalink: m.permalink ?? '',
      timestamp: m.timestamp ?? '',
      likes: m.like_count ?? 0,
      comments: m.comments_count ?? 0,
      reach: ins.reach ?? 0,
      views: ins.views ?? 0,
      saved: ins.saved ?? 0,
      shares: ins.shares ?? 0,
      interactions: ins.total_interactions ?? 0,
    }
  })

  return Response.json({ posts, count: posts.length })
}
