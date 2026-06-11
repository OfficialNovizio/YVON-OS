import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  AnalyticsReport,
  TrendItem,
  TrendStatus,
  ActivityEvent,
  ActivityEventType,
  AgentId,
} from '@/lib/types'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface SocialSnapshot {
  id: string
  ventureId: string
  platform: 'instagram' | 'youtube' | 'linkedin'
  capturedAt: string
  data: Record<string, unknown>
}

export interface AnalyticsSnapshot {
  id: string
  ventureId: string
  capturedAt: string
  periodStart: string | null
  periodEnd: string | null
  data: Record<string, unknown>
}

export interface CompetitorSnapshot {
  id: string
  ventureId: string
  platform: string
  competitorUrl: string | null
  capturedAt: string
  rawContent: Record<string, unknown>
  kaiAnalysis: Record<string, unknown> | null
}

export interface GrowthBaseline {
  id: string
  ventureId: string
  platform: string
  metricKey: string
  baselineValue: number
  baselineDate: string
  setBy: string
  notes: string | null
  createdAt: string
}

export interface GrowthPoint {
  capturedAt: string
  value: number
}

export interface GrowthMetric {
  platform: string
  metricKey: string
  baseline: Pick<GrowthBaseline, 'baselineValue' | 'baselineDate' | 'setBy'> | null
  currentValue: number | null
  currentCapturedAt: string | null
  growthPct: number | null
  history: GrowthPoint[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractSocialMetric(
  platform: 'instagram' | 'youtube' | 'linkedin',
  data: Record<string, unknown>
): { metricKey: string; value: number } | null {
  switch (platform) {
    case 'instagram': {
      const v = data.followersCount ?? data.followers ?? data.follower_count
      return typeof v === 'number' ? { metricKey: 'followers', value: v } : null
    }
    case 'youtube': {
      const v = data.subscriberCount ?? data.subscribers
      return typeof v === 'number' ? { metricKey: 'subscribers', value: v } : null
    }
    case 'linkedin': {
      const v = data.followerCount ?? data.followers ?? data.followersCount
      return typeof v === 'number' ? { metricKey: 'followers', value: v } : null
    }
  }
}

function extractAnalyticsMetric(data: Record<string, unknown>): number | null {
  const v = data.sessions ?? data.totalSessions
  return typeof v === 'number' ? v : null
}

// ─── Analytics Reports ────────────────────────────────────────────────────────

export async function getAnalyticsReport(ventureId: string): Promise<AnalyticsReport | null> {
  const { data } = await supabase
    .from('analytics_reports')
    .select('data')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data?.data ?? null
}

export async function setAnalyticsReport(
  ventureId: string,
  report: AnalyticsReport
): Promise<void> {
  await supabase.from('analytics_reports').insert({
    venture_id: ventureId,
    data: report,
    period: report.period,
  })
}

// ─── Trending ─────────────────────────────────────────────────────────────────

export async function getTrendingItems(
  ventureId: string,
  status?: TrendStatus
): Promise<TrendItem[]> {
  let query = supabase
    .from('trending_items')
    .select('*')
    .eq('venture_id', ventureId)
    .order('generated_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)

  const { data } = await query
  return (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    angle: row.angle,
    platform: row.platform,
    status: row.status,
    generatedAt: row.generated_at,
  }))
}

export async function upsertTrendingItem(
  ventureId: string,
  item: Omit<TrendItem, 'id'> & { id?: string }
): Promise<void> {
  await supabase.from('trending_items').upsert({
    id: item.id ?? crypto.randomUUID(),
    venture_id: ventureId,
    keyword: item.keyword,
    angle: item.angle,
    platform: item.platform,
    status: item.status,
    generated_at: item.generatedAt,
  })
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function getActivityFeed(
  ventureId: string,
  limit = 50
): Promise<ActivityEvent[]> {
  const { data } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    type: r.type as ActivityEventType,
    message: r.message,
    metadata: r.metadata ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function logActivityEvent(
  event: Omit<ActivityEvent, 'id' | 'createdAt'>
): Promise<void> {
  await supabase.from('activity_feed').insert({
    venture_id: event.ventureId,
    agent_id: event.agentId ?? null,
    type: event.type,
    message: event.message,
    metadata: event.metadata ?? null,
  })
}

// ─── Social Snapshots ─────────────────────────────────────────────────────────

export async function insertSocialSnapshot(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  data: Record<string, unknown>
): Promise<void> {
  await supabase.from('social_snapshots').insert({
    venture_id:  ventureId,
    platform,
    data,
    captured_at: new Date().toISOString(),
  })

  const metric = extractSocialMetric(platform, data)
  if (metric) {
    await supabase.from('growth_baselines').upsert(
      {
        venture_id:     ventureId,
        platform,
        metric_key:     metric.metricKey,
        baseline_value: metric.value,
        baseline_date:  new Date().toISOString().split('T')[0],
        set_by:         'auto',
      },
      { onConflict: 'venture_id,platform,metric_key', ignoreDuplicates: true }
    )
  }
}

export async function getSocialHistory(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  days = 30
): Promise<SocialSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('social_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
  return (data ?? []).map(r => ({
    id:         r.id as string,
    ventureId:  r.venture_id as string,
    platform:   r.platform as SocialSnapshot['platform'],
    capturedAt: r.captured_at as string,
    data:       r.data as Record<string, unknown>,
  }))
}

// ─── Analytics Snapshots ──────────────────────────────────────────────────────

export async function insertAnalyticsSnapshot(
  ventureId: string,
  data: Record<string, unknown>,
  periodStart?: string,
  periodEnd?: string
): Promise<void> {
  await supabase.from('analytics_snapshots').insert({
    venture_id:   ventureId,
    data,
    period_start: periodStart ?? null,
    period_end:   periodEnd ?? null,
    captured_at:  new Date().toISOString(),
  })

  const sessions = extractAnalyticsMetric(data)
  if (sessions != null) {
    await supabase.from('growth_baselines').upsert(
      {
        venture_id:     ventureId,
        platform:       'ga4',
        metric_key:     'sessions',
        baseline_value: sessions,
        baseline_date:  new Date().toISOString().split('T')[0],
        set_by:         'auto',
      },
      { onConflict: 'venture_id,platform,metric_key', ignoreDuplicates: true }
    )
  }
}

export async function getAnalyticsHistory(
  ventureId: string,
  days = 30
): Promise<AnalyticsSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
  return (data ?? []).map(r => ({
    id:          r.id as string,
    ventureId:   r.venture_id as string,
    capturedAt:  r.captured_at as string,
    periodStart: (r.period_start as string | null) ?? null,
    periodEnd:   (r.period_end as string | null) ?? null,
    data:        r.data as Record<string, unknown>,
  }))
}

// ─── Competitor Snapshots ─────────────────────────────────────────────────────

export async function insertCompetitorSnapshot(
  ventureId: string,
  platform: string,
  rawContent: Record<string, unknown>,
  competitorUrl?: string,
  kaiAnalysis?: Record<string, unknown>
): Promise<void> {
  await supabase.from('competitor_snapshots').insert({
    venture_id:     ventureId,
    platform,
    competitor_url: competitorUrl ?? null,
    raw_content:    rawContent,
    kai_analysis:   kaiAnalysis ?? null,
    captured_at:    new Date().toISOString(),
  })
}

export async function getCompetitorHistory(
  ventureId: string,
  platform: string,
  days = 90
): Promise<CompetitorSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('captured_at', since)
    .order('captured_at', { ascending: false })
    .limit(50)
  return (data ?? []).map(r => ({
    id:            r.id as string,
    ventureId:     r.venture_id as string,
    platform:      r.platform as string,
    competitorUrl: (r.competitor_url as string | null) ?? null,
    capturedAt:    r.captured_at as string,
    rawContent:    r.raw_content as Record<string, unknown>,
    kaiAnalysis:   (r.kai_analysis as Record<string, unknown> | null) ?? null,
  }))
}

// ─── Growth Baselines ─────────────────────────────────────────────────────────

export async function getGrowthBaselines(ventureId: string): Promise<GrowthBaseline[]> {
  const { data } = await supabase
    .from('growth_baselines')
    .select('*')
    .eq('venture_id', ventureId)
    .order('platform')
  return (data ?? []).map(r => ({
    id:            r.id as string,
    ventureId:     r.venture_id as string,
    platform:      r.platform as string,
    metricKey:     r.metric_key as string,
    baselineValue: r.baseline_value as number,
    baselineDate:  r.baseline_date as string,
    setBy:         r.set_by as string,
    notes:         (r.notes as string | null) ?? null,
    createdAt:     r.created_at as string,
  }))
}

export async function setGrowthBaseline(
  ventureId: string,
  platform: string,
  metricKey: string,
  value: number,
  notes?: string
): Promise<void> {
  await supabase.from('growth_baselines').upsert(
    {
      venture_id:     ventureId,
      platform,
      metric_key:     metricKey,
      baseline_value: value,
      baseline_date:  new Date().toISOString().split('T')[0],
      set_by:         'stark',
      notes:          notes ?? null,
    },
    { onConflict: 'venture_id,platform,metric_key' }
  )
}

// ─── Growth Summary ───────────────────────────────────────────────────────────

export async function getGrowthSummary(ventureId: string): Promise<GrowthMetric[]> {
  const baselines = await getGrowthBaselines(ventureId)
  if (baselines.length === 0) return []

  const metrics: GrowthMetric[] = []

  for (const baseline of baselines) {
    if (baseline.platform === 'ga4') {
      const history = await getAnalyticsHistory(ventureId, 30)
      const points: GrowthPoint[] = history
        .map(s => {
          const val = extractAnalyticsMetric(s.data)
          return val != null ? { capturedAt: s.capturedAt, value: val } : null
        })
        .filter((p): p is GrowthPoint => p !== null)

      const latest = points.at(-1) ?? null
      const growthPct = latest != null && baseline.baselineValue !== 0
        ? Math.round(((latest.value - baseline.baselineValue) / baseline.baselineValue) * 1000) / 10
        : null

      metrics.push({
        platform:          'ga4',
        metricKey:         baseline.metricKey,
        baseline:          { baselineValue: baseline.baselineValue, baselineDate: baseline.baselineDate, setBy: baseline.setBy },
        currentValue:      latest?.value ?? null,
        currentCapturedAt: latest?.capturedAt ?? null,
        growthPct,
        history:           points,
      })
    } else {
      const platform = baseline.platform as 'instagram' | 'youtube' | 'linkedin'
      const history = await getSocialHistory(ventureId, platform, 30)
      const points: GrowthPoint[] = history
        .map(s => {
          const metric = extractSocialMetric(platform, s.data)
          return metric ? { capturedAt: s.capturedAt, value: metric.value } : null
        })
        .filter((p): p is GrowthPoint => p !== null)

      const latest = points.at(-1) ?? null
      const growthPct = latest != null && baseline.baselineValue !== 0
        ? Math.round(((latest.value - baseline.baselineValue) / baseline.baselineValue) * 1000) / 10
        : null

      metrics.push({
        platform:          baseline.platform,
        metricKey:         baseline.metricKey,
        baseline:          { baselineValue: baseline.baselineValue, baselineDate: baseline.baselineDate, setBy: baseline.setBy },
        currentValue:      latest?.value ?? null,
        currentCapturedAt: latest?.capturedAt ?? null,
        growthPct,
        history:           points,
      })
    }
  }

  return metrics
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function getInsights(
  venture: string,
  days: number,
  agentId?: AgentId,
): Promise<{
  totalTokens: number
  totalCostUsd: number
  sessionCount: number
  byAgent: Array<{ agentId: string; tokens: number; costUsd: number; sessions: number }>
  byDay: Array<{ date: string; tokens: number; costUsd: number }>
  topSkills: Array<{ name: string; useCount: number; lastUsedAt: string | null; lifecycleState: string }>
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let sessionQ = supabase
    .from('agent_sessions')
    .select('agent_id, tokens_used, cost_usd, created_at')
    .eq('venture', venture)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (agentId) sessionQ = sessionQ.eq('agent_id', agentId)

  const { data: sessions } = await sessionQ

  const rows = sessions ?? []
  const totalTokens  = rows.reduce((s, r) => s + ((r.tokens_used as number) || 0), 0)
  const totalCostUsd = rows.reduce((s, r) => s + ((r.cost_usd as number) || 0), 0)

  const agentMap: Record<string, { tokens: number; costUsd: number; sessions: number }> = {}
  for (const r of rows) {
    const id = r.agent_id as string
    if (!agentMap[id]) agentMap[id] = { tokens: 0, costUsd: 0, sessions: 0 }
    agentMap[id].tokens   += (r.tokens_used as number) || 0
    agentMap[id].costUsd  += (r.cost_usd as number)    || 0
    agentMap[id].sessions += 1
  }

  const dayMap: Record<string, { tokens: number; costUsd: number }> = {}
  for (const r of rows) {
    const day = (r.created_at as string).slice(0, 10)
    if (!dayMap[day]) dayMap[day] = { tokens: 0, costUsd: 0 }
    dayMap[day].tokens  += (r.tokens_used as number) || 0
    dayMap[day].costUsd += (r.cost_usd as number)    || 0
  }

  const { data: skillsData } = await supabase
    .from('skills')
    .select('name, use_count, last_used_at, lifecycle_state')
    .order('use_count', { ascending: false })
    .limit(10)

  return {
    totalTokens,
    totalCostUsd,
    sessionCount:  rows.length,
    byAgent:       Object.entries(agentMap).map(([id, v]) => ({ agentId: id, ...v })),
    byDay:         Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
    topSkills:     (skillsData ?? []).map(r => ({
      name:            r.name as string,
      useCount:        (r.use_count as number) || 0,
      lastUsedAt:      (r.last_used_at as string | null) ?? null,
      lifecycleState:  (r.lifecycle_state as string) || 'active',
    })),
  }
}
