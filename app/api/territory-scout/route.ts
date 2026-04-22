// Territory Scout — identifies unclaimed content territory
// GET: returns current territory clusters
// POST: runs full territory scout analysis

import { cookies } from 'next/headers'
import { getTerritoryClusters, upsertTerritoryClusters, identifyUnclaimedTerritory } from '@/lib/market-radar'
import type { TerritoryCluster } from '@/lib/market-radar'

// GET /api/territory-scout
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const clusters = await getTerritoryClusters(ventureId)
  const unclaimed = identifyUnclaimedTerritory(clusters)

  return Response.json({
    ventureId,
    totalClusters: clusters.length,
    unclaimedCount: unclaimed.length,
    unclaimedTerritories: unclaimed,
    allClusters: clusters,
    generatedAt: new Date().toISOString(),
  })
}

// POST /api/territory-scout — Run territory scout (AI analysis)
export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { brandName?: string; industry?: string; existingClusters?: TerritoryCluster[] }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const client = new (await import('@anthropic-ai/sdk')).default({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const prompt = `You are a content territory scout. Analyze the content landscape for a brand in this space: ${body.brandName ?? 'Novizio'} ${body.industry ?? ''}.

Identify 10-15 topic clusters in this niche. For each cluster provide:
1. cluster_name — concise name
2. keywords — 3-5 keywords that define this cluster
3. saturation_score — 0-100, how crowded this topic is with content (0=empty, 100=flooded)
4. engagement_ceiling — 0-100, estimated max engagement ceiling for this topic type
5. trend_direction — "up", "down", or "stable"
6. is_claimed — boolean, whether major competitors already dominate this space
7. recommended_posting_frequency — "daily", "3x_weekly", "weekly", or "biweekly"
8. score — composite score = (100 - saturation) * 0.4 + engagement_ceiling * 0.3 + (trend == "up" ? 30 : trend == "stable" ? 15 : 0)

Return ONLY a JSON array of objects with these exact keys. No markdown, no explanation.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const match = raw.match(/\[[\s\S]*\]/)
    const clusters = match ? JSON.parse(match[0]) as Record<string, unknown>[] : []

    const mapped: TerritoryCluster[] = clusters.map((c) => {
      const saturation = Number(c.saturation_score ?? 0)
      const engagement = Number(c.engagement_ceiling ?? 0)
      const trend = c.trend_direction as string
      const trendBonus = trend === 'up' ? 30 : trend === 'stable' ? 15 : 0
      const score = (100 - saturation) * 0.4 + engagement * 0.3 + trendBonus

      return {
        clusterName: (c.cluster_name as string) ?? 'Unknown',
        keywords: Array.isArray(c.keywords) ? c.keywords as string[] : [],
        saturationScore: saturation,
        competitorOwnership: [] as string[],
        engagementCeiling: engagement,
        isClaimed: c.is_claimed as boolean ?? false,
        trendDirection: trend as 'up' | 'down' | 'stable',
        recommendedPostingFrequency: (c.recommended_posting_frequency as string) ?? 'weekly',
        score: parseFloat(score.toFixed(2)),
      }
    })

    await upsertTerritoryClusters(ventureId, mapped)

    const unclaimed = identifyUnclaimedTerritory(mapped)

    return Response.json({
      ventureId,
      totalClusters: mapped.length,
      unclaimedCount: unclaimed.length,
      unclaimedTerritories: unclaimed,
      allClusters: mapped,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}