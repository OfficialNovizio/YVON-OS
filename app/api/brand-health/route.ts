/**
 * /api/brand-health
 * Returns competitive brand health data for the Portfolio tab.
 * Only shows real data from connected sources. Empty when no competitors configured.
 *
 * GET ?venture=novizio&period=8w
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const venture  = req.nextUrl.searchParams.get('venture')

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture param' }, { status: 400 })
  }

  // No real brand score data exists — no YVON Health Score snapshots table
  // No real competitors configured — no competitor_tracking table
  return NextResponse.json({
    hasData: false,
    hasCompetitors: false,
    ourScore: null,
    compAvg: null,
    target: null,
    industryBenchmark: null,
    bestCompetitor: null,
    competitors: [],
    trend: [],
  })
}
