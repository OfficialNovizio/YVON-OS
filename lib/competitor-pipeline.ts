/**
 * lib/competitor-pipeline.ts
 * Competitor intelligence pipeline — discovery → scraping → scoring → insight.
 *
 * Flow:
 *   1. resolveHandles() — AI-powered social handle discovery for a brand name
 *   2. scrapeCompetitor() — run Apify actors per platform, save metrics + posts
 *   3. scoreAndSave() — compute signal score from fresh metrics
 *   4. generateIntel() — Kai (Anthropic) brief on the competitor
 *
 * Tier model:
 *   benchmark — 50k–200k followers, realistic peers. Gap cards generated.
 *   stretch   — 200k–600k followers, visible horizon. Included in SOV.
 *   anchor    — 1M+ followers, directional reference only. Excluded from SOV/scoring.
 *
 * All writes go to: competitors, competitor_socials, competitor_metrics,
 * competitor_snapshots. Reads competitor intelligence from the same tables.
 */
import 'server-only'
import { supabase } from '@/lib/supabase'
import {
  getToken,
  scrapeInstagramFull,
  scrapeTikTokFull,
  scrapeLinkedInFull,
  scrapeYouTubeFull,
} from '@/lib/apify'
import type { ScraperResult } from '@/lib/apify'
import { upsertCompetitors, upsertCompetitorMetrics } from '@/lib/market-radar'
import { insertCompetitorSnapshot } from '@/lib/db'
import { callFast } from '@/lib/ai-client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Platform = 'instagram' | 'tiktok' | 'linkedin' | 'youtube'
export type CompetitorTier = 'benchmark' | 'stretch' | 'anchor'

export interface CompetitorHandle {
  platform: Platform
  handle: string
}

export interface PipelineResult {
  competitorId: string
  brandName: string
  tier: CompetitorTier
  platforms: {
    platform: Platform
    handle: string
    status: 'success' | 'failed'
    followers: number
    engagementRate: number
    postCount: number
    error?: string
  }[]
  signalScore: number
  lastChecked: string
}

export interface CompetitorIntel {
  competitorId: string
  brandName: string
  url: string | null
  tier: CompetitorTier
  signalScore: number
  followerGrowthRate: number
  shareOfVoice: number
  weekOverWeekChange: number
  platforms: {
    platform: Platform
    handle: string
    followers: number
    engagementRate: number
    monthlyReach: number
  }[]
  kaiBrief?: {
    situation: string
    threatLevel: 'high' | 'medium' | 'low'
    recommendedAction: string
  }
}

export interface GapCard {
  competitorName: string
  totalFollowers: number
  followerGap: number
  engagementRate: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n === 0 ? 'No data' : String(n)
}

// ─── Handle Resolution ────────────────────────────────────────────────────────

const KNOWN_HANDLES: Record<string, CompetitorHandle[]> = {
  // Fintech only — fashion brands resolved via AI to get tier-appropriate handles
  monzo: [
    { platform: 'instagram', handle: 'monzo' },
    { platform: 'tiktok', handle: 'monzobank' },
    { platform: 'linkedin', handle: 'https://www.linkedin.com/company/monzo-bank/' },
    { platform: 'youtube', handle: '@monzo' },
  ],
  revolut: [
    { platform: 'instagram', handle: 'revolutapp' },
    { platform: 'tiktok', handle: 'revolut' },
    { platform: 'linkedin', handle: 'https://www.linkedin.com/company/revolut/' },
    { platform: 'youtube', handle: '@revolutapp' },
  ],
  zara: [
    { platform: 'instagram', handle: 'zara' },
    { platform: 'tiktok', handle: 'zara' },
    { platform: 'youtube', handle: '@zara' },
  ],
}

export async function resolveHandles(
  brandName: string,
  knownHandles?: CompetitorHandle[],
): Promise<CompetitorHandle[]> {
  const key = brandName.toLowerCase().trim()

  if (KNOWN_HANDLES[key]) return KNOWN_HANDLES[key]
  if (knownHandles && knownHandles.length > 0) return knownHandles

  try {
    const raw = await callFast({
      messages: [{
        role: 'user',
        content: `For the brand "${brandName}", return their official social media handles.

Return ONLY a JSON object with this exact format — no markdown, no explanation:
{
  "handles": [
    {"platform": "instagram", "handle": "brandname"},
    {"platform": "tiktok", "handle": "brandname"},
    {"platform": "youtube", "handle": "@brandname"},
    {"platform": "linkedin", "handle": "https://www.linkedin.com/company/brandname/"}
  ]
}

Only include platforms where you are confident the brand has an official presence. If unsure about a platform, omit it.
For LinkedIn, use the full company URL. For YouTube, use the @handle format. For Instagram/TikTok, use the bare handle without @.`,
      }],
      maxTokens: 256,
    })
    const match = raw.trim().match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (parsed.handles && Array.isArray(parsed.handles)) {
        return parsed.handles.filter((h: any) =>
          ['instagram', 'tiktok', 'linkedin', 'youtube'].includes(h.platform),
        )
      }
    }
  } catch { /* fall through to best-effort guess */ }

  const slug = key.replace(/\s+/g, '')
  return [
    { platform: 'instagram', handle: slug },
    { platform: 'tiktok', handle: slug },
  ]
}

// ─── Scraping ─────────────────────────────────────────────────────────────────

export async function scrapeCompetitor(
  competitorId: string,
  brandName: string,
  handles: CompetitorHandle[],
): Promise<PipelineResult['platforms']> {
  let token: string
  try {
    token = await getToken()
  } catch {
    return handles.map(h => ({
      platform: h.platform,
      handle: h.handle,
      status: 'failed' as const,
      followers: 0,
      engagementRate: 0,
      postCount: 0,
      error: 'APIFY_TOKEN not configured',
    }))
  }

  const results = await Promise.allSettled(
    handles.map(async (h): Promise<PipelineResult['platforms'][0]> => {
      let data: ScraperResult
      switch (h.platform) {
        case 'instagram': data = await scrapeInstagramFull(token, h.handle); break
        case 'tiktok':    data = await scrapeTikTokFull(token, h.handle);    break
        case 'linkedin':  data = await scrapeLinkedInFull(token, h.handle);  break
        case 'youtube':   data = await scrapeYouTubeFull(token, h.handle);   break
        default: throw new Error(`Unsupported platform: ${h.platform}`)
      }

      await upsertCompetitorMetrics(competitorId, [{
        platform: h.platform,
        followers: data.metrics.followers,
        engagementRate: data.metrics.engagement_rate,
        monthlyReach: Math.round(data.metrics.avg_views * (data.metrics.posts_count || 1)),
        estimatedMonthlyTraffic: 0,
      }])

      if (data.posts.length > 0) {
        await insertCompetitorSnapshot(
          competitorId,
          h.platform,
          { posts: data.posts.slice(0, 10), scrapedAt: new Date().toISOString() },
          h.handle,
        ).catch(() => {})
      }

      return {
        platform: h.platform,
        handle: h.handle,
        status: 'success' as const,
        followers: data.metrics.followers,
        engagementRate: Math.round(data.metrics.engagement_rate * 10000) / 10000,
        postCount: data.metrics.posts_count,
      }
    }),
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return {
      platform: handles[i].platform,
      handle: handles[i].handle,
      status: 'failed' as const,
      followers: 0,
      engagementRate: 0,
      postCount: 0,
      error: (r.reason as Error)?.message ?? 'Unknown error',
    }
  })
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeSignalScore(platforms: PipelineResult['platforms']): number {
  const successes = platforms.filter(p => p.status === 'success')
  if (successes.length === 0) return 0

  const totalFollowers = successes.reduce((s, p) => s + p.followers, 0)
  const avgEng = successes.reduce((s, p) => s + p.engagementRate, 0) / successes.length

  const followerScore   = Math.min(Math.log10(Math.max(totalFollowers, 1)) * 10, 35)
  const engagementScore = Math.min(avgEng * 1000, 30)
  const platformDiv     = Math.min(successes.length * 10, 20)
  const contentVelocity = Math.min(successes.reduce((s, p) => s + p.postCount, 0) * 0.5, 15)

  return Math.round(Math.min(followerScore + engagementScore + platformDiv + contentVelocity, 100))
}

// ─── Full Pipeline ────────────────────────────────────────────────────────────

export async function runCompetitorPipeline(
  ventureId: string,
  competitors: Array<{
    brandName: string
    url?: string
    handles?: CompetitorHandle[]
    tier?: CompetitorTier
    isCustom?: boolean
  }>,
): Promise<PipelineResult[]> {
  const baseScores = competitors.map(c => ({
    brandName: c.brandName,
    url: c.url,
    signalScore: 0,
    followerGrowthRate: 0,
    trafficSpikeDetected: false,
    viralContentCount: 0,
    fundingRoundDetected: false,
    shareOfVoice: 0,
    weekOverWeekChange: 0,
    tier: c.tier ?? 'benchmark',
    isCustom: c.isCustom ?? false,
  }))
  await upsertCompetitors(ventureId, baseScores)

  const { data: savedComps } = await supabase
    .from('competitors')
    .select('id, brand_name')
    .eq('venture_id', ventureId)

  const compMap = new Map((savedComps ?? []).map((c: any) => [c.brand_name, c.id]))

  const pipelineResults: PipelineResult[] = []

  for (const comp of competitors) {
    const compId = compMap.get(comp.brandName) as string
    if (!compId) continue

    const handles = await resolveHandles(comp.brandName, comp.handles)

    if (handles.length > 0) {
      try {
        await supabase.from('competitor_socials').upsert(
          handles.map(h => ({
            competitor_id: compId,
            platform: h.platform,
            handle_or_url: h.handle,
          })),
          { onConflict: 'competitor_id,platform' },
        )
      } catch { /* non-fatal */ }
    }

    const platformResults = await scrapeCompetitor(compId, comp.brandName, handles)
    const signalScore = computeSignalScore(platformResults)

    const { data: prevMetrics } = await supabase
      .from('competitor_metrics')
      .select('followers')
      .eq('competitor_id', compId)
      .order('recorded_at', { ascending: false })
      .limit(handles.length * 2)

    let followerGrowthRate = 0
    if (prevMetrics && prevMetrics.length >= handles.length) {
      const current  = platformResults.reduce((s, p) => s + p.followers, 0)
      const half     = Math.floor(prevMetrics.length / 2)
      const previous = (prevMetrics.slice(half) as any[]).reduce((s: number, m: any) => s + (m.followers ?? 0), 0)
      if (previous > 0) followerGrowthRate = ((current - previous) / previous) * 100
    }

    // SOV calculated only within benchmark + stretch, not anchor
    const tier = comp.tier ?? 'benchmark'
    let shareOfVoice = 0
    if (tier !== 'anchor') {
      const { data: allComps } = await supabase
        .from('competitors')
        .select('id')
        .eq('venture_id', ventureId)
        .in('tier', ['benchmark', 'stretch'])

      const allCompIds = (allComps ?? []).map((c: any) => c.id)
      const { data: allMetrics } = await supabase
        .from('competitor_metrics')
        .select('competitor_id, followers')
        .in('competitor_id', allCompIds)

      if (allMetrics && allMetrics.length > 0) {
        const totalAllFollowers = (allMetrics as any[]).reduce((s: number, m: any) => s + (m.followers ?? 0), 0)
        const ourFollowers      = platformResults.reduce((s, p) => s + p.followers, 0)
        shareOfVoice = totalAllFollowers > 0
          ? Math.round((ourFollowers / totalAllFollowers) * 1000) / 10
          : 0
      }
    }

    await supabase.from('competitors').update({
      signal_score: signalScore,
      follower_growth_rate: Math.round(followerGrowthRate * 100) / 100,
      share_of_voice: shareOfVoice,
      week_over_week_change: 0,
      last_checked: new Date().toISOString(),
    }).eq('id', compId)

    pipelineResults.push({
      competitorId: compId,
      brandName: comp.brandName,
      tier: tier as CompetitorTier,
      platforms: platformResults,
      signalScore,
      lastChecked: new Date().toISOString(),
    })
  }

  return pipelineResults
}

// ─── Intelligence Read ────────────────────────────────────────────────────────

export async function getCompetitorIntelligence(ventureId: string): Promise<{
  signals: Array<{ id: string; severity: 'red' | 'amber' | 'green'; text: string; cta: string }>
  kpis: Array<{ label: string; icon: string; value: string; unit: string; delta: string; up: boolean | null }>
  competitors: Array<{
    name: string; initial: string; sov: string; sentiment: string
    sentUp: boolean | null; momentum: string; accent: boolean; dashed: boolean
    tier: 'benchmark' | 'stretch'
  }>
  anchor: { name: string; initial: string; followersFormatted: string } | null
  gapCards: GapCard[]
}> {
  const { data: compRows } = await supabase
    .from('competitors')
    .select('*')
    .eq('venture_id', ventureId)
    .order('signal_score', { ascending: false })

  const allComps = (compRows ?? []) as any[]
  if (allComps.length === 0) return { signals: [], kpis: [], competitors: [], anchor: null, gapCards: [] }

  // Fetch all metrics
  const compIds = allComps.map((c: any) => c.id)
  const { data: metricRows } = await supabase
    .from('competitor_metrics')
    .select('*')
    .in('competitor_id', compIds)
    .order('recorded_at', { ascending: false })

  const metricsByComp: Record<string, any[]> = {}
  for (const m of (metricRows ?? [])) {
    if (!metricsByComp[m.competitor_id]) metricsByComp[m.competitor_id] = []
    metricsByComp[m.competitor_id].push(m)
  }

  // Separate by tier (default legacy data to 'benchmark')
  const anchorComp = allComps.find((c: any) => c.tier === 'anchor') ?? null
  const benchmarkComps = allComps.filter((c: any) => !c.tier || c.tier === 'benchmark')
  const stretchComps   = allComps.filter((c: any) => c.tier === 'stretch')
  const sovComps       = [...benchmarkComps, ...stretchComps]

  // Signals — from benchmark + stretch only
  const signals: Array<{ id: string; severity: 'red' | 'amber' | 'green'; text: string; cta: string }> = []
  for (const c of sovComps) {
    const score = Number(c.signal_score ?? 0)
    if (score > 60) {
      signals.push({
        id: `comp-${c.id}`,
        severity: 'red',
        text: `${c.brand_name}: Signal score ${score} — high activity. ${Number(c.follower_growth_rate ?? 0).toFixed(1)}% follower growth.`,
        cta: 'Analyze',
      })
    } else if (score > 30) {
      signals.push({
        id: `comp-${c.id}`,
        severity: 'amber',
        text: `${c.brand_name}: Signal score ${score} — moderate presence. Monitor content velocity.`,
        cta: 'Review',
      })
    }
    if (c.traffic_spike_detected) {
      signals.push({
        id: `spike-${c.id}`,
        severity: 'amber',
        text: `${c.brand_name}: Traffic spike detected. Possible campaign or viral moment.`,
        cta: 'Investigate',
      })
    }
  }

  // KPIs — based on benchmark + stretch only
  const sovScores = sovComps.map((c: any) => Number(c.signal_score ?? 0))
  const avgScore  = sovScores.length > 0
    ? sovScores.reduce((a: number, b: number) => a + b, 0) / sovScores.length
    : 0

  const sovMetricRows = (metricRows ?? []).filter((m: any) =>
    sovComps.some((c: any) => c.id === m.competitor_id),
  )

  const kpis = [
    {
      label: 'Competitors Tracked', icon: 'radar',
      value: String(sovComps.length), unit: '',
      delta: `${sovComps.filter((c: any) => c.last_checked).length} with data`,
      up: null as boolean | null,
    },
    {
      label: 'Avg Signal Score', icon: 'trending_up',
      value: String(Math.round(avgScore)), unit: '/100',
      delta: avgScore > 40 ? 'Above threshold' : 'Below threshold',
      up: avgScore > 40 ? true : false,
    },
    {
      label: 'Total Share of Voice', icon: 'record_voice_over',
      value: String(Math.round(sovComps.reduce((s: number, c: any) => s + Number(c.share_of_voice ?? 0), 0) * 10) / 10),
      unit: '%',
      delta: 'Benchmark + Stretch only',
      up: null as boolean | null,
    },
    {
      label: 'Avg Engagement', icon: 'favorite',
      value: sovMetricRows.length > 0
        ? (sovMetricRows.reduce((s: number, m: any) => s + Number(m.engagement_rate ?? 0), 0) / sovMetricRows.length * 100).toFixed(1)
        : '0.0',
      unit: '%',
      delta: 'Real data',
      up: true,
    },
  ]

  // Competitor list — benchmark + stretch only
  const compList = sovComps.map((c: any, i: number) => {
    const score  = Number(c.signal_score ?? 0)
    const sov    = Number(c.share_of_voice ?? 0)
    const growth = Number(c.follower_growth_rate ?? 0)
    const tier   = (c.tier ?? 'benchmark') as 'benchmark' | 'stretch'

    return {
      name:      c.brand_name,
      initial:   c.brand_name.charAt(0).toUpperCase(),
      sov:       `${sov.toFixed(1)}%`,
      sentiment: score > 50 ? 'Strong' : score > 25 ? 'Moderate' : 'Low',
      sentUp:    score > 40 ? true : score > 20 ? null : false,
      momentum:  growth > 5 ? 'arrow_upward' : growth < -2 ? 'arrow_downward' : 'arrow_forward',
      accent:    i === 0,
      dashed:    score === 0,
      tier,
    }
  })

  // Gap cards — benchmark only
  const gapCards: GapCard[] = benchmarkComps.map((c: any) => {
    const metrics = (metricsByComp[c.id] ?? []).slice(0, 4)
    const totalFollowers = metrics.reduce((s: number, m: any) => s + Number(m.followers ?? 0), 0)
    const avgER = metrics.length > 0
      ? metrics.reduce((s: number, m: any) => s + Number(m.engagement_rate ?? 0), 0) / metrics.length * 100
      : null

    return {
      competitorName:  c.brand_name,
      totalFollowers,
      followerGap:     totalFollowers, // vs our ~0 baseline; UI shows "your gap to reach them"
      engagementRate:  avgER !== null ? Math.round(avgER * 10) / 10 : null,
    }
  })

  // Anchor brand
  let anchor: { name: string; initial: string; followersFormatted: string } | null = null
  if (anchorComp) {
    const anchorMetrics = metricsByComp[anchorComp.id] ?? []
    const totalFollowers = anchorMetrics.reduce((s: number, m: any) => s + Number(m.followers ?? 0), 0)
    anchor = {
      name:              anchorComp.brand_name,
      initial:           anchorComp.brand_name.charAt(0).toUpperCase(),
      followersFormatted: fmtFollowers(totalFollowers),
    }
  }

  return {
    signals: signals.slice(0, 5),
    kpis,
    competitors: compList,
    anchor,
    gapCards,
  }
}
