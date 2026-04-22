// Phase 1 DB helpers — standalone module re-exported from db.ts
// Import from '@/lib/db-phase1' directly.

import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  ContentScoreCard,
  AnomalyAlert,
  AudienceMomentumEntry,
  AttributionPath,
  PostHogSession as PHS,
} from '@/lib/types'

type PostHogSessionRow = PHS & { id?: string; createdAt?: string }

export async function getContentScores(
  ventureId: string,
  platform?: string,
  limit = 100
): Promise<ContentScoreCard[]> {
  let q = supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: false })
    .limit(limit)
  if (platform) q = q.eq('platform', platform)

  const { data } = await q
  return (data ?? []).map(mapScoreCard)
}

export async function getTopContent(ventureId: string, n = 10, platform?: string): Promise<ContentScoreCard[]> {
  let q = supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: false })
    .limit(n)
  if (platform) q = q.eq('platform', platform)
  const { data } = await q
  return (data ?? []).map(mapScoreCard)
}

export async function getWorstContent(ventureId: string, n = 10, platform?: string): Promise<ContentScoreCard[]> {
  let q = supabase
    .from('content_scores')
    .select('*')
    .eq('venture_id', ventureId)
    .order('composite_score', { ascending: true })
    .limit(n)
  if (platform) q = q.eq('platform', platform)
  const { data } = await q
  return (data ?? []).map(mapScoreCard)
}

export async function upsertContentScores(cards: Omit<ContentScoreCard, 'id' | 'fetchedAt'>[]): Promise<void> {
  if (cards.length === 0) return
  await supabase.from('content_scores').upsert(
    cards.map((c) => ({
      venture_id: c.ventureId,
      platform: c.platform,
      post_id: c.postId,
      post_url: c.postUrl ?? null,
      caption_preview: c.captionPreview ?? null,
      reach: c.reach,
      likes: c.likes,
      comments: c.comments,
      saves: c.saves,
      shares: c.shares,
      engagement_rate: c.engagementRate,
      save_rate: c.saveRate,
      share_rate: c.shareRate,
      composite_score: c.compositeScore,
      post_date: c.postDate,
      fetched_at: new Date().toISOString(),
    })),
    { onConflict: 'venture_id,platform,post_id' }
  )
}

function mapScoreCard(r: Record<string, unknown>): ContentScoreCard {
  return {
    id: r.id as string,
    ventureId: r.venture_id as string,
    platform: r.platform as string,
    postId: r.post_id as string,
    postUrl: (r.post_url as string | null) ?? undefined,
    captionPreview: (r.caption_preview as string | null) ?? undefined,
    reach: r.reach as number ?? 0,
    likes: r.likes as number ?? 0,
    comments: r.comments as number ?? 0,
    saves: r.saves as number ?? 0,
    shares: r.shares as number ?? 0,
    engagementRate: parseFloat((r.engagement_rate as string) ?? '0'),
    saveRate: parseFloat((r.save_rate as string) ?? '0'),
    shareRate: parseFloat((r.share_rate as string) ?? '0'),
    compositeScore: parseFloat((r.composite_score as string) ?? '0'),
    postDate: r.post_date as string,
    fetchedAt: r.fetched_at as string,
  }
}

export async function getAnomalyAlerts(
  ventureId: string,
  status?: 'active' | 'acknowledged' | 'resolved',
  limit = 50
): Promise<AnomalyAlert[]> {
  let q = supabase
    .from('anomaly_alerts')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (status) q = q.eq('status', status)

  const { data } = await q
  return (data ?? []).map(r => ({
    id: r.id as string,
    ventureId: r.venture_id as string,
    alertType: r.alert_type as AnomalyAlert['alertType'],
    metricName: r.metric_name as string,
    currentValue: parseFloat((r.current_value as string) ?? '0'),
    baselineValue: parseFloat((r.baseline_value as string) ?? '0'),
    changePct: parseFloat((r.change_pct as string) ?? '0'),
    severity: r.severity as AnomalyAlert['severity'],
    message: (r.message as string | null) ?? undefined,
    status: r.status as AnomalyAlert['status'],
    createdAt: r.created_at as string,
  }))
}

export async function createAnomalyAlert(alert: Omit<AnomalyAlert, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('anomaly_alerts').insert({
    venture_id: alert.ventureId,
    alert_type: alert.alertType,
    metric_name: alert.metricName,
    current_value: alert.currentValue,
    baseline_value: alert.baselineValue,
    change_pct: alert.changePct,
    severity: alert.severity,
    message: alert.message ?? null,
    status: alert.status,
  })
}

export async function acknowledgeAnomaly(id: string): Promise<void> {
  await supabase
    .from('anomaly_alerts')
    .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
    .eq('id', id)
}

export async function resolveAnomaly(id: string, status: 'resolved' | 'active' | 'acknowledged'): Promise<void> {
  await supabase
    .from('anomaly_alerts')
    .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
    .eq('id', id)
}

export async function getAudienceMomentum(
  ventureId: string,
  platform?: string,
  weeks = 8
): Promise<AudienceMomentumEntry[]> {
  let q = supabase
    .from('audience_momentum')
    .select('*')
    .eq('venture_id', ventureId)
    .order('week_start', { ascending: false })
    .limit(weeks)
  if (platform) q = q.eq('platform', platform)

  const { data } = await q
  return (data ?? []).map(r => ({
    id: r.id as string,
    ventureId: r.venture_id as string,
    platform: r.platform as string,
    weekStart: r.week_start as string,
    newFollowers: r.new_followers as number ?? 0,
    avgEngagementRate: parseFloat((r.avg_engagement_rate as string) ?? '0'),
    followerQualityScore: parseFloat((r.follower_quality_score as string) ?? '0'),
    trendDirection: (r.trend_direction as 'up' | 'down' | 'stable' | null) ?? undefined,
    trendDelta: parseFloat((r.trend_delta as string) ?? '0'),
  }))
}

export async function upsertAudienceMomentum(entries: Omit<AudienceMomentumEntry, 'id'>[]): Promise<void> {
  if (entries.length === 0) return
  await supabase.from('audience_momentum').upsert(
    entries.map((e) => ({
      venture_id: e.ventureId,
      platform: e.platform,
      week_start: e.weekStart,
      new_followers: e.newFollowers,
      avg_engagement_rate: e.avgEngagementRate,
      follower_quality_score: e.followerQualityScore,
      trend_direction: e.trendDirection ?? 'stable',
      trend_delta: e.trendDelta,
    })),
    { onConflict: 'venture_id,platform,week_start' }
  )
}

export async function getAttributionMap(
  ventureId: string,
  postId?: string,
  limit = 50
): Promise<AttributionPath[]> {
  let q = supabase
    .from('attribution_map')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (postId) q = q.eq('post_id', postId)

  const { data } = await q
  return (data ?? []).map(r => ({
    id: r.id as string,
    ventureId: r.venture_id as string,
    postId: r.post_id as string,
    postPlatform: r.post_platform as string,
    postUrl: (r.post_url as string | null) ?? undefined,
    postDate: r.post_date as string,
    sessionId: (r.session_id as string | null) ?? undefined,
    utmParams: (r.utm_params as Record<string, string> | null) ?? undefined,
    revenueEventId: (r.revenue_event_id as string | null) ?? undefined,
    revenueAmount: r.revenue_amount as number ?? 0,
    attributionWeight: parseFloat((r.attribution_weight as string) ?? '0'),
    conversionType: r.conversion_type as AttributionPath['conversionType'],
    touchpoints: (r.touchpoints as Record<string, unknown>[] | null) ?? undefined,
  }))
}

export async function createAttributionEntry(entry: Omit<AttributionPath, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('attribution_map').insert({
    venture_id: entry.ventureId,
    post_id: entry.postId,
    post_platform: entry.postPlatform,
    post_url: entry.postUrl ?? null,
    post_date: entry.postDate,
    session_id: entry.sessionId ?? null,
    utm_params: entry.utmParams ?? null,
    revenue_event_id: entry.revenueEventId ?? null,
    revenue_amount: entry.revenueAmount,
    attribution_weight: entry.attributionWeight,
    conversion_type: entry.conversionType,
    touchpoints: entry.touchpoints ?? null,
  })
}

export async function getRevenueEvents(
  ventureId: string,
  since?: string,
  limit = 100
): Promise<{
  id: string;
  ventureId: string;
  eventType: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  createdAt: string;
}[]> {
  let q = supabase
    .from('revenue_events')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (since) q = q.gte('created_at', since)

  const { data } = await q
  return (data ?? []).map(r => ({
    id: r.id as string,
    ventureId: r.venture_id as string,
    eventType: r.event_type as string,
    amount: r.amount as number,
    currency: (r.currency as string) ?? 'usd',
    customerEmail: (r.customer_email as string | null) ?? undefined,
    customerId: (r.customer_id as string | null) ?? undefined,
    sessionId: (r.session_id as string | null) ?? undefined,
    utmSource: (r.utm_source as string | null) ?? undefined,
    utmMedium: (r.utm_medium as string | null) ?? undefined,
    utmCampaign: (r.utm_campaign as string | null) ?? undefined,
    utmContent: (r.utm_content as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }))
}

export async function createRevenueEvent(event: {
  ventureId: string;
  eventType: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  customerId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  productId?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('revenue_events')
    .insert({
      venture_id: event.ventureId,
      event_type: event.eventType,
      amount: event.amount,
      currency: event.currency ?? 'usd',
      customer_email: event.customerEmail ?? null,
      customer_id: event.customerId ?? null,
      session_id: event.sessionId ?? null,
      utm_source: event.utmSource ?? null,
      utm_medium: event.utmMedium ?? null,
      utm_campaign: event.utmCampaign ?? null,
      utm_content: event.utmContent ?? null,
      utm_term: event.utmTerm ?? null,
      product_id: event.productId ?? null,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error('Failed to create revenue event')
  return data.id as string
}

export async function getPostHogSessionsDb(
  ventureId: string,
  since?: string,
  limit = 100
): Promise<PostHogSessionRow[]> {
  let q = supabase
    .from('posthog_sessions')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (since) q = q.gte('created_at', since)

  const { data } = await q
  return (data ?? []).map(r => ({
    id: r.id as string,
    ventureId: r.venture_id as string,
    sessionId: r.session_id as string,
    distinctId: (r.distinct_id as string | null) ?? undefined,
    utmSource: (r.utm_source as string | null) ?? undefined,
    utmMedium: (r.utm_medium as string | null) ?? undefined,
    utmCampaign: (r.utm_campaign as string | null) ?? undefined,
    utmContent: (r.utm_content as string | null) ?? undefined,
    utmTerm: (r.utm_term as string | null) ?? undefined,
    referrer: (r.referrer as string | null) ?? undefined,
    deviceType: (r.device_type as string | null) ?? undefined,
    browser: (r.browser as string | null) ?? undefined,
    country: (r.country as string | null) ?? undefined,
    pagesViewed: r.pages_viewed as number ?? 0,
    sessionStart: (r.session_start as string | null) ?? undefined,
    sessionEnd: (r.session_end as string | null) ?? undefined,
    converted: r.converted as boolean ?? false,
    conversionValue: (r.conversion_value as number | null) ?? undefined,
    createdAt: r.created_at as string,
  }))
}

export async function upsertPostHogSession(session: Omit<PostHogSessionRow, 'id' | 'createdAt'>): Promise<void> {
  await supabase
    .from('posthog_sessions')
    .upsert(
      {
        venture_id: session.ventureId,
        session_id: session.sessionId,
        distinct_id: session.distinctId ?? null,
        utm_source: session.utmSource ?? null,
        utm_medium: session.utmMedium ?? null,
        utm_campaign: session.utmCampaign ?? null,
        utm_content: session.utmContent ?? null,
        utm_term: session.utmTerm ?? null,
        referrer: session.referrer ?? null,
        device_type: session.deviceType ?? null,
        browser: session.browser ?? null,
        country: session.country ?? null,
        pages_viewed: session.pagesViewed ?? 0,
        session_start: session.sessionStart ?? null,
        session_end: session.sessionEnd ?? null,
        converted: session.converted ?? false,
        conversion_value: session.conversionValue ?? null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'venture_id,session_id' }
    )
}
