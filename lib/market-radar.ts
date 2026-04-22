import 'server-only'
import { supabase } from '@/lib/supabase'

// ─── Scoring Engine ──────────────────────────────────────────────────────────────

export interface CompetitorScoreInput {
  followerGrowthRate: number
  trafficSpike: boolean
  viralContentCount: number
  fundingDetected: boolean
  shareOfVoice: number
  engagementRate: number
  monthlyReach: number
}

export function scoreCompetitor(input: CompetitorScoreInput): number {
  const followerScore = Math.min(input.followerGrowthRate * 5, 25)
  const trafficScore = input.trafficSpike ? 15 : 0
  const viralScore = Math.min(input.viralContentCount * 5, 20)
  const fundingScore = input.fundingDetected ? 10 : 0
  const sovScore = Math.min(input.shareOfVoice * 2, 15)
  const engagementScore = Math.min(input.engagementRate * 100, 15)
  const reachScore = Math.min(input.monthlyReach / 10000, 10)

  return Math.min(
    followerScore + trafficScore + viralScore + fundingScore + sovScore + engagementScore + reachScore,
    100
  )
}

export interface CompetitorChange {
  brandName: string
  scoreBefore: number
  scoreAfter: number
  direction: 'up' | 'down' | 'stable'
  delta: number
}

export function detectCompetitorChanges(
  current: { brandName: string; score: number }[],
  previous: { brandName: string; score: number }[]
): CompetitorChange[] {
  return current.map((c) => {
    const prev = previous.find((p) => p.brandName === c.brandName)
    const delta = prev ? c.score - prev.score : 0
    const direction: CompetitorChange['direction'] =
      delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable'
    return {
      brandName: c.brandName,
      scoreBefore: prev?.score ?? 0,
      scoreAfter: c.score,
      direction,
      delta: parseFloat(delta.toFixed(2)),
    }
  })
}

// ─── Territory Scout ───────────────────────────────────────────────────────────────

export interface TerritoryCluster {
  clusterName: string
  keywords: string[]
  saturationScore: number
  competitorOwnership: string[]
  engagementCeiling: number
  isClaimed: boolean
  trendDirection: 'up' | 'down' | 'stable'
  recommendedPostingFrequency: string
  score: number
}

export function identifyUnclaimedTerritory(
  clusters: TerritoryCluster[]
): TerritoryCluster[] {
  return clusters
    .filter(
      (c) =>
        !c.isClaimed &&
        c.saturationScore < 40 &&
        c.trendDirection === 'up'
    )
    .sort((a, b) => b.score - a.score)
}

// ─── Supabase Helpers ──────────────────────────────────────────────────────────

export async function getCompetitors(ventureId: string): Promise<
  Array<{
    id: string
    ventureId: string
    brandName: string
    url: string | null
    signalScore: number
    followerGrowthRate: number
    trafficSpikeDetected: boolean
    viralContentCount: number
    fundingRoundDetected: boolean
    shareOfVoice: number
    weekOverWeekChange: number
    lastChecked: string
  }>
> {
  const { data } = await supabase
    .from('competitors')
    .select('*')
    .eq('venture_id', ventureId)
    .order('signal_score', { ascending: false })
    .limit(10)

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    brandName: r.brand_name,
    url: (r.url as string | null) ?? null,
    signalScore: parseFloat(r.signal_score as string ?? '0'),
    followerGrowthRate: parseFloat(r.follower_growth_rate as string ?? '0'),
    trafficSpikeDetected: r.traffic_spike_detected as boolean,
    viralContentCount: r.viral_content_count as number ?? 0,
    fundingRoundDetected: r.funding_round_detected as boolean,
    shareOfVoice: parseFloat(r.share_of_voice as string ?? '0'),
    weekOverWeekChange: parseFloat(r.week_over_week_change as string ?? '0'),
    lastChecked: r.last_checked,
  }))
}

export async function upsertCompetitors(
  ventureId: string,
  competitors: Array<{
    brandName: string
    url?: string
    signalScore: number
    followerGrowthRate?: number
    trafficSpikeDetected?: boolean
    viralContentCount?: number
    fundingRoundDetected?: boolean
    shareOfVoice?: number
    weekOverWeekChange?: number
  }>
): Promise<void> {
  if (competitors.length === 0) return
  await supabase.from('competitors').upsert(
    competitors.map((c) => ({
      venture_id: ventureId,
      brand_name: c.brandName,
      url: c.url ?? null,
      signal_score: c.signalScore,
      follower_growth_rate: c.followerGrowthRate ?? 0,
      traffic_spike_detected: c.trafficSpikeDetected ?? false,
      viral_content_count: c.viralContentCount ?? 0,
      funding_round_detected: c.fundingRoundDetected ?? false,
      share_of_voice: c.shareOfVoice ?? 0,
      week_over_week_change: c.weekOverWeekChange ?? 0,
      last_checked: new Date().toISOString(),
    })),
    { onConflict: 'venture_id,brand_name' }
  )
}

export async function upsertCompetitorMetrics(
  competitorId: string,
  metrics: Array<{
    platform: string
    followers?: number
    engagementRate?: number
    monthlyReach?: number
    estimatedMonthlyTraffic?: number
  }>
): Promise<void> {
  if (metrics.length === 0) return
  await supabase.from('competitor_metrics').upsert(
    metrics.map((m) => ({
      competitor_id: competitorId,
      platform: m.platform,
      followers: m.followers ?? 0,
      engagement_rate: m.engagementRate ?? 0,
      monthly_reach: m.monthlyReach ?? 0,
      estimated_monthly_traffic: m.estimatedMonthlyTraffic ?? 0,
      recorded_at: new Date().toISOString(),
    })),
    { onConflict: 'competitor_id,platform' }
  )
}

export async function getTerritoryClusters(
  ventureId: string
): Promise<TerritoryCluster[]> {
  const { data } = await supabase
    .from('territory_clusters')
    .select('*')
    .eq('venture_id', ventureId)
    .order('score', { ascending: false })

  return (data ?? []).map((r) => ({
    clusterName: r.cluster_name,
    keywords: (r.keywords as string[]) ?? [],
    saturationScore: parseFloat(r.saturation_score as string ?? '0'),
    competitorOwnership: (r.competitor_ownership as string[]) ?? [],
    engagementCeiling: parseFloat(r.engagement_ceiling as string ?? '0'),
    isClaimed: r.is_claimed as boolean,
    trendDirection: (r.trend_direction as 'up' | 'down' | 'stable') ?? 'stable',
    recommendedPostingFrequency: (r.recommended_posting_frequency as string) ?? 'weekly',
    score: parseFloat(r.score as string ?? '0'),
  }))
}

export async function upsertTerritoryClusters(
  ventureId: string,
  clusters: TerritoryCluster[]
): Promise<void> {
  if (clusters.length === 0) return
  await supabase.from('territory_clusters').upsert(
    clusters.map((c) => ({
      venture_id: ventureId,
      cluster_name: c.clusterName,
      keywords: c.keywords,
      saturation_score: c.saturationScore,
      competitor_ownership: c.competitorOwnership,
      engagement_ceiling: c.engagementCeiling,
      is_claimed: c.isClaimed,
      trend_direction: c.trendDirection,
      recommended_posting_frequency: c.recommendedPostingFrequency,
      first_mover_alert: !c.isClaimed && c.saturationScore < 30 && c.trendDirection === 'up',
      score: c.score,
    })),
    { onConflict: 'venture_id,cluster_name' }
  )
}
