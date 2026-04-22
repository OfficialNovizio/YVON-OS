// POST /api/content-score - Scores raw social post data into content_scores
// Accepts batch of posts with platform + metric data
// Returns scored cards with composite scores

import { cookies } from 'next/headers'
import { upsertContentScores } from '@/lib/db-phase1'
import { enrichScoreCards, calculateCompositeScore } from '@/lib/content-scorer'
import type { ContentScoreCard } from '@/lib/types'

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: {
    platform: string
    posts: Array<{
      postId: string
      postUrl?: string
      captionPreview?: string
      postDate?: string
      reach?: number
      likes?: number
      comments?: number
      saves?: number
      shares?: number
    }>
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { platform, posts } = body
  if (!platform || !Array.isArray(posts) || posts.length === 0) {
    return Response.json({ error: 'platform and posts[] required' }, { status: 400 })
  }

  const cards: ContentScoreCard[] = posts.map((p) => {
    const reach = p.reach ?? 0
    const saveRate = reach > 0 ? (p.saves ?? 0) / reach : 0
    const shareRate = reach > 0 ? (p.shares ?? 0) / reach : 0
    const totalEng = (p.saves ?? 0) + (p.shares ?? 0) + (p.comments ?? 0) + (p.likes ?? 0)
    const engagementRate = reach > 0 ? totalEng / reach : 0
    const compositeScore = calculateCompositeScore(
      { reach, saves: p.saves ?? 0, shares: p.shares ?? 0, comments: p.comments ?? 0 },
      platform
    )

    return {
      id: undefined,
      ventureId,
      platform,
      postId: p.postId,
      postUrl: p.postUrl,
      captionPreview: p.captionPreview,
      reach,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      saves: p.saves ?? 0,
      shares: p.shares ?? 0,
      engagementRate,
      saveRate,
      shareRate,
      compositeScore,
      postDate: p.postDate ?? new Date().toISOString().split('T')[0],
    }
  })

  const scoredCards = enrichScoreCards(cards)

  try {
    await upsertContentScores(
      scoredCards.map((c) => ({
        ventureId: c.ventureId,
        platform: c.platform,
        postId: c.postId,
        postUrl: c.postUrl,
        captionPreview: c.captionPreview,
        reach: c.reach,
        likes: c.likes,
        comments: c.comments,
        saves: c.saves,
        shares: c.shares,
        engagementRate: c.engagementRate,
        saveRate: c.saveRate,
        shareRate: c.shareRate,
        compositeScore: c.compositeScore,
        postDate: c.postDate,
      }))
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `DB error: ${msg}` }, { status: 500 })
  }

  return Response.json({ scored: scoredCards.length, cards: scoredCards })
}

// GET /api/content-score - Fetches scored content
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const topN = parseInt(searchParams.get('top') ?? '10')
  const worstN = parseInt(searchParams.get('worst') ?? '10')
  const platform = searchParams.get('platform') ?? undefined

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { getTopContent, getWorstContent } = await import('@/lib/db-phase1')
  const top = await getTopContent(ventureId, topN, platform)
  const worst = await getWorstContent(ventureId, worstN, platform)

  return Response.json({ ventureId, platform, top, worst })
}
