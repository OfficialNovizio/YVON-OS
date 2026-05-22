// Reports Generator — Cron-triggered. Generates structured reports for analytics/marketing/competitor.
// POST /api/reports/generate?type=analytics|marketing|competitor
// Called by Vercel Cron (24h/48h schedule). Also callable manually with CRON_SECRET.

import { cookies } from 'next/headers'
import { callFast } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'
import { insertReport } from '@/lib/reports'

export const maxDuration = 120

function isoDateAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0]
}

// ─── Analytics Report ───────────────────────────────────────────────────────────

async function genAnalyticsReport(ventureId: string, ventureName: string) {
  // Pull GA4 data if available
  let gaData: Record<string, unknown> = {}
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL not set — required for GA4 self-call')
    const gaRes = await fetch(`${siteUrl}/api/analytics?ventureId=${ventureId}`)
    if (gaRes.ok) gaData = await gaRes.json() as Record<string, unknown>
  } catch { /* GA4 not configured — continue without */ }

  // Pull social stats
  const { data: social } = await supabase
    .from('social_stats')
    .select('*')
    .eq('venture_id', ventureId)
    .order('fetched_at', { ascending: false })
    .limit(20)

  // Pull content scores for trend
  const { data: topContent } = await supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: false })
    .limit(5)

  // Kai generates the report text
  const summary = await callFast({
    messages: [{
      role: 'user',
      content: `Generate a concise analytics report for ${ventureName} (${ventureId}).

GA4 data: ${JSON.stringify(gaData).slice(0, 500)}
Social stats: ${JSON.stringify(social ?? []).slice(0, 500)}
Top content scores: ${JSON.stringify(topContent ?? []).slice(0, 300)}

Write in this format (no markdown):

ANALYTICS SNAPSHOT
Period: [last 7-30 days depending on data]
Sessions: [real number or "N/A"] — [trend]
Bounce rate: [real number or "N/A"] — [trend]
Top page: [real path or "N/A"]

ANOMALIES
- [any >15% delta or "None significant"]

CONTENT SIGNAL
Top performer: [best piece format + what made it work or "Insufficient data"]
Pattern: [what's working or "Not enough data to establish pattern"]

CHANNEL HEALTH
[2-3 sentences on which channels are up/down and why]

KEY INSIGHT
[One sentence — the single most important thing to act on]`,
    }],
    maxTokens: 600,
  })

  // Detect anomalies from GA data
  const anomalies: Record<string, unknown> = {}
  if (gaData && typeof gaData === 'object' && 'sessions' in gaData) {
    // Simple anomaly detection placeholder — GA4 response shape varies
    anomalies.sessions = (gaData as Record<string, unknown>).sessions ?? null
  }

  const now = new Date()
  const periodStart = isoDateAgo(30)
  const periodEnd = now.toISOString().split('T')[0]

  return insertReport(ventureId, 'analytics', periodStart, periodEnd,
    `Analytics Report — ${ventureName}`,
    summary,
    { gaData, socialCount: social?.length ?? 0, topContentCount: topContent?.length ?? 0 },
    Object.keys(anomalies).length > 0 ? anomalies : null,
  )
}

// ─── Marketing Report ───────────────────────────────────────────────────────────

async function genMarketingReport(ventureId: string, ventureName: string) {
  const { data: topContent } = await supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: false })
    .limit(3)

  const { data: worstContent } = await supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: true })
    .limit(3)

  const { data: variants } = await supabase
    .from('content_variants')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(10)

  const summary = await callFast({
    messages: [{
      role: 'user',
      content: `Generate a marketing report for ${ventureName}.

Top content: ${JSON.stringify(topContent ?? []).slice(0, 400)}
Worst content: ${JSON.stringify(worstContent ?? []).slice(0, 400)}
Active variants: ${JSON.stringify(variants ?? []).slice(0, 300)}

Write in this format:

CONTENT OUTPUT
Total scored: [count or "N/A"]
Top piece: [caption preview] — score: [X] — reason it worked
Worst piece: [caption preview] — score: [X] — reason it failed

PATTERN
[What the top 3 have in common that the bottom 3 don't]

VARIANT QUEUE
[Any pending variants? or "None"]

SPRINT STATUS
[check if any active sprints or "No active sprint"]

RECOMMENDATION
[One sentence: the highest-leverage content move]`,
    }],
    maxTokens: 500,
  })

  const now = new Date()
  const periodStart = isoDateAgo(7)
  const periodEnd = now.toISOString().split('T')[0]

  return insertReport(ventureId, 'marketing', periodStart, periodEnd,
    `Marketing Report — ${ventureName}`,
    summary,
    {
      topContentCount: topContent?.length ?? 0,
      worstContentCount: worstContent?.length ?? 0,
      variantCount: variants?.length ?? 0,
    },
    null,
  )
}

// ─── Competitor Report ──────────────────────────────────────────────────────────

async function genCompetitorReport(ventureId: string, ventureName: string) {
  const { data: competitors } = await supabase
    .from('market_competitors')
    .select('*')
    .eq('venture_id', ventureId)
    .order('signal_score', { ascending: false })

  const { data: clusters } = await supabase
    .from('territory_clusters')
    .select('*')
    .eq('venture_id', ventureId)

  // Identify unclaimed territory
  const unclaimed = (clusters ?? [])
    .filter((c: Record<string, unknown>) => (c.saturation_score as number ?? 100) < 50)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.score as number ?? 0) - (a.score as number ?? 0))
    .slice(0, 3)

  const summary = await callFast({
    messages: [{
      role: 'user',
      content: `Generate a competitor intelligence report for ${ventureName}.

Competitors: ${JSON.stringify(competitors ?? []).slice(0, 500)}
Territory clusters: ${JSON.stringify(clusters ?? []).slice(0, 400)}
Unclaimed territory: ${JSON.stringify(unclaimed).slice(0, 300)}

Write in this format:

COMPETITOR LANDSCAPE
[List top 3 competitors with: what they're doing, engagement signal, their gap]

UNCLAIMED TERRITORY
[Topic clusters no competitor owns — name + saturation + urgency]

MARKET OPPORTUNITY
[one sentence on the single best move]

URGENCY
[HIGH/MEDIUM/LOW — if high, name the competitor moving toward this space]`,
    }],
    maxTokens: 500,
  })

  const now = new Date()
  const periodStart = isoDateAgo(7)
  const periodEnd = now.toISOString().split('T')[0]

  return insertReport(ventureId, 'competitor', periodStart, periodEnd,
    `Competitor Report — ${ventureName}`,
    summary,
    { competitorCount: competitors?.length ?? 0, clusterCount: clusters?.length ?? 0 },
    null,
  )
}

// ─── POST Handler ───────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const reportType = url.searchParams.get('type') ?? ''

  const cookieStore = await cookies()
  const ventureId = url.searchParams.get('ventureId') ?? cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const ventureName = ventureId === 'hourbour' ? 'Hourbour' : 'Novizio'

  try {
    let report
    switch (reportType) {
      case 'analytics':
        report = await genAnalyticsReport(ventureId, ventureName)
        break
      case 'marketing':
        report = await genMarketingReport(ventureId, ventureName)
        break
      case 'competitor':
        report = await genCompetitorReport(ventureId, ventureName)
        break
      default:
        return Response.json({ error: `Unknown report type: ${reportType}. Use analytics, marketing, or competitor.` }, { status: 400 })
    }

    return Response.json({
      success: true,
      reportId: report.id,
      reportType,
      reportNumber: report.reportNumber,
      createdAt: report.createdAt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
