// Market Radar — Dynamic Competitor Engine
// GET: returns competitive landscape
// POST: triggers competitor analysis + re-scoring

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCompetitors, upsertCompetitors, scoreCompetitor, getTerritoryClusters, upsertTerritoryClusters, identifyUnclaimedTerritory } from '@/lib/market-radar'
import { getTopContent, getContentScores } from '@/lib/db-phase1'
import type { TerritoryCluster } from '@/lib/market-radar'

// GET /api/market-radar — Scorecard data
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)
  let ventureId = searchParams.get('ventureId')
  if (!ventureId) {
    const cookieStore = await cookies()
    ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  }

  const competitors = await getCompetitors(ventureId)
  const clusters = await getTerritoryClusters(ventureId)
  const unclaimed = identifyUnclaimedTerritory(clusters)

  return Response.json({
    competitors,
    unclaimedTerritories: unclaimed,
    totalTerritories: clusters.length,
    generatedAt: new Date().toISOString(),
  })
}

// POST /api/market-radar — Run competitor analysis
export async function POST(req: NextRequest): Promise<Response> {
  let body: {
    ventureId?: string
    ventureName?: string
    competitors: Array<{
      brandName: string
      url?: string
      followerGrowthRate?: number
      trafficSpike?: boolean
      viralContentCount?: number
      fundingDetected?: boolean
      shareOfVoice?: number
      engagementRate?: number
      monthlyReach?: number
    }>
  }
  try {
    body = await req.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureId = body.ventureId ?? cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const scored = body.competitors.map((c) => {
    const score = scoreCompetitor({
      followerGrowthRate: c.followerGrowthRate ?? 0,
      trafficSpike: c.trafficSpike ?? false,
      viralContentCount: c.viralContentCount ?? 0,
      fundingDetected: c.fundingDetected ?? false,
      shareOfVoice: c.shareOfVoice ?? 0,
      engagementRate: c.engagementRate ?? 0,
      monthlyReach: c.monthlyReach ?? 0,
    })
    return {
      brandName: c.brandName,
      url: c.url,
      signalScore: score,
      followerGrowthRate: c.followerGrowthRate ?? 0,
      trafficSpikeDetected: c.trafficSpike ?? false,
      viralContentCount: c.viralContentCount ?? 0,
      fundingRoundDetected: c.fundingDetected ?? false,
      shareOfVoice: c.shareOfVoice ?? 0,
      weekOverWeekChange: 0,
    }
  })

  await upsertCompetitors(ventureId, scored)

  return Response.json({ scored: scored.length, competitors: scored })
}
