// Revenue Attribution Loop — UTM → PostHog → Stripe → rank revenue-per-post
// GET: returns attribution map and revenue-per-post ranking

import { getRevenueEvents, getAttributionMap, getPostHogSessionsDb, getTopContent } from '@/lib/db-phase1'
import { cookies } from 'next/headers'

// GET /api/revenue-attribution
export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { searchParams } = new URL(request.url)
  const since = searchParams.get('since') ?? ''

  const revenueEvents = await getRevenueEvents(ventureId, since || undefined)
  const attributionPaths = await getAttributionMap(ventureId)
  const phSessions = await getPostHogSessionsDb(ventureId, since || undefined)
  const topContent = await getTopContent(ventureId, 100)

  // Calculate revenue-per-post
  const postRevenue = new Map<string, { total: number; count: number }>()
  for (const path of attributionPaths) {
    const existing = postRevenue.get(path.postId) ?? { total: 0, count: 0 }
    existing.total += path.revenueAmount
    existing.count++
    postRevenue.set(path.postId, existing)
  }

  // Calculate revenue by platform
  const platformRevenue = new Map<string, number>()
  for (const event of revenueEvents.filter((e) => e.eventType === 'charge.succeeded')) {
    const platform = event.utmSource ?? 'direct'
    platformRevenue.set(platform, (platformRevenue.get(platform) ?? 0) + event.amount)
  }

  // Calculate UTM campaign ROI
  const campaignROI = new Map<string, { revenue: number; posts: number }>()
  for (const post of topContent) {
    // Cross-reference with attribution to find revenue by post format
  }

  const rankedPosts = topContent
    .map((p) => ({
      ...p,
      attributedRevenue: postRevenue.get(p.postId)?.total ?? 0,
      conversionCount: postRevenue.get(p.postId)?.count ?? 0,
    }))
    .sort((a, b) => b.attributedRevenue - a.attributedRevenue)

  return Response.json({
    ventureId,
    totalRevenue: revenueEvents.filter((e) => e.eventType === 'charge.succeeded').reduce((sum, e) => sum + e.amount, 0),
    totalSessions: phSessions.length,
    conversionRate: phSessions.length > 0
      ? `${((phSessions.filter((s) => s.converted).length / phSessions.length) * 100).toFixed(1)}%`
      : null,
    revenueByPlatform: Object.fromEntries(platformRevenue),
    rankedPosts,
    attributionPaths,
    generatedAt: new Date().toISOString(),
  })
}
