/**
 * /api/analytics-overview
 * Returns overview dashboard data — only from real connected sources.
 * No estimated/fabricated data. Empty arrays when no data exists.
 *
 * GET ?venture=novizio&period=30d
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const venture  = searchParams.get('venture')

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture param' }, { status: 400 })
  }

  // Check if venture has connected social accounts
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id')
    .eq('slug', venture)
    .limit(1)

  const ventureId = (ventures?.[0] as any)?.id
  let connectedPlatforms = 0
  let hasSnapshots = false

  if (ventureId) {
    const { count: acctCount } = await supabase
      .from('venture_socials')
      .select('*', { count: 'exact', head: true })
      .eq('venture_id', ventureId)
    connectedPlatforms = acctCount ?? 0

    const { count: snapCount } = await supabase
      .from('social_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('venture_slug', venture)
    hasSnapshots = (snapCount ?? 0) > 0
  }

  // Return empty data — nothing to show until accounts connected + data fetched
  return NextResponse.json({
    hasLiveData: false,
    connectedPlatforms,
    hasSnapshots,
    revenueByChannel: [],
    followerGrowth: [],
    cacChannels: [],
    signals: [],
    topics: [],
    insights: [],
  })
}
