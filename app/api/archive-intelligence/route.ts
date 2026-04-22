import { cookies } from 'next/headers'
import { getArchiveRecommendations } from '@/lib/archive-intelligence'
import { getTrendingItems } from '@/lib/db'

// GET /api/archive-intelligence — cross-references old content with current trends
export async function GET(): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const trending = await getTrendingItems(ventureId, 'new')
  const trends = trending.map((t) => t.keyword)
  const recommendations = await getArchiveRecommendations(ventureId, trends.length > 0 ? trends : ['trending'])

  return Response.json({
    ventureId,
    trendsUsed: trends,
    recommendations,
  })
}
