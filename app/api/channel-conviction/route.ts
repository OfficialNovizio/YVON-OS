// Channel Conviction Engine — identifies the single highest-leverage platform
// GET: returns recommended channel for this venture

import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { getTopContent, getRevenueEvents } from '@/lib/db-phase1'
import { supabase } from '@/lib/supabase'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { searchParams } = new URL('https://x')
  const topContent = await getTopContent(ventureId, 50)
  const revenue = await getRevenueEvents(ventureId)

  if (topContent.length === 0) {
    return Response.json({ ventureId, recommended: null, reason: 'Not enough data — publish some content first', confidence: 0 })
  }

  // Calculate platform-leverage score
  const platformStats = new Map<string, {
    count: number
    totalScore: number
    avgSaveRate: number
    avgShareRate: number
    totalRevenue: number
  }>()

  for (const c of topContent) {
    const stats = platformStats.get(c.platform) ?? {
      count: 0, totalScore: 0, avgSaveRate: 0, avgShareRate: 0, totalRevenue: 0
    }
    stats.count++
    stats.totalScore += c.compositeScore
    stats.avgSaveRate += c.saveRate
    stats.avgShareRate += c.shareRate
    platformStats.set(c.platform, stats)
  }

  for (const e of revenue) {
    const platform = e.utmSource ?? 'direct'
    const stats = platformStats.get(platform) ?? {
      count: 0, totalScore: 0, avgSaveRate: 0, avgShareRate: 0, totalRevenue: 0
    }
    stats.totalRevenue += e.amount
    platformStats.set(platform, stats)
  }

  // Score each platform: composite avg + save/share rates + revenue
  let topPlatform = ''
  let topScore = 0
  const details: Record<string, unknown> = {}

  for (const [platform, stats] of platformStats) {
    const compositeAvg = stats.count > 0 ? stats.totalScore / stats.count : 0
    const saveRateAvg = stats.avgSaveRate / stats.count
    const shareRateAvg = stats.avgShareRate / stats.count
    const revenueScore = stats.totalRevenue / 10000
    const totalScore = compositeAvg * 0.4 + saveRateAvg * 30 + shareRateAvg * 30 + revenueScore

    details[platform] = {
      posts: stats.count,
      avgComposite: Math.round(compositeAvg * 100) / 100,
      avgSaveRate: (saveRateAvg * 100).toFixed(2) + '%',
      avgShareRate: (shareRateAvg * 100).toFixed(2) + '%',
      totalRevenue: stats.totalRevenue,
      score: Math.round(totalScore * 100) / 100,
    }

    if (totalScore > topScore) {
      topScore = totalScore
      topPlatform = platform
    }
  }

  return Response.json({
    ventureId,
    recommended: topPlatform,
    confidence: Math.min(topScore, 100),
    platformBreakdown: details,
  })
}
