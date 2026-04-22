// /api/anomaly-check — Cron + on-demand anomaly detection
// Checks current metrics against baselines and generates alerts when thresholds breach.
// Thresholds (configurable via env or query params):
//   reach_drop: reach falls >30% WoW
//   engagement_spike: post performs >3x above baseline
//   revenue_anomaly: daily revenue deviates >40% from 7-day avg
//   sentiment_shift: engagement quality drops 3 weeks running

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getContentScores, getRevenueEvents, getAudienceMomentum, createAnomalyAlert } from '@/lib/db-phase1'
import type { AnomalyAlert } from '@/lib/types'

type Threshold = {
  reach_drop: { pct: number }
  engagement_spike: { multiplier: number }
  revenue_anomaly: { pct: number }
  audience_dip: { weeks: number; direction: string }
}

const DEFAULT_THRESHOLDS: Threshold = {
  reach_drop: { pct: 30 },
  engagement_spike: { multiplier: 3 },
  revenue_anomaly: { pct: 40 },
  audience_dip: { weeks: 3, direction: 'down' },
}

function resolveThresholds(req: NextRequest): Threshold {
  const url = new URL(req.url)
  return {
    reach_drop: { pct: parseFloat(url.searchParams.get('reach_drop_pct') ?? '30') },
    engagement_spike: { multiplier: parseFloat(url.searchParams.get('engagement_spike_x') ?? '3') },
    revenue_anomaly: { pct: parseFloat(url.searchParams.get('revenue_anomaly_pct') ?? '40') },
    audience_dip: {
      weeks: parseInt(url.searchParams.get('audience_dip_weeks') ?? '3'),
      direction: 'down' as const,
    },
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const ventureId = searchParams.get('ventureId')
    ? searchParams.get('ventureId') as string
    : searchParams.get('venture_id')
    ? searchParams.get('venture_id') as string
    : 'novizio'

  const thresholds = resolveThresholds(req)
  const alerts: AnomalyAlert[] = []

  // 1. Content score baselines — check for reach drops and engagement spikes
  const scores = await getContentScores(ventureId, undefined, 100)

  if (scores.length > 0) {
    // Calculate platform-baseline averages
    const baselines = new Map<string, { avgReach: number; avgEngage: number; count: number }>()
    for (const s of scores) {
      const b = baselines.get(s.platform) ?? { avgReach: 0, avgEngage: 0, count: 0 }
      b.avgReach += s.reach
      b.avgEngage += s.engagementRate
      b.count++
      baselines.set(s.platform, b)
    }

    for (const [platform, b] of baselines) {
      b.avgReach /= b.count
      b.avgEngage /= b.count

      for (const s of scores) {
        // Reach drop check
        if (b.avgReach > 0) {
          const reachDelta = ((s.reach - b.avgReach) / b.avgReach) * 100
          if (reachDelta < -thresholds.reach_drop.pct) {
            alerts.push({
              ventureId,
              alertType: 'reach_drop',
              metricName: 'post_reach',
              currentValue: s.reach,
              baselineValue: b.avgReach,
              changePct: reachDelta,
              severity: reachDelta < -50 ? 'critical' : 'warning',
              message: `Post ${s.postId}: reach ${Math.abs(Math.round(reachDelta))}% below ${platform} baseline (${s.reach} vs ${Math.round(b.avgReach)})`,
              status: 'active',
            })
          }
        }

        // Engagement spike check
        if (b.avgEngage > 0) {
          const spikeRatio = s.engagementRate / b.avgEngage
          if (spikeRatio > thresholds.engagement_spike.multiplier) {
            alerts.push({
              ventureId,
              alertType: 'engagement_spike',
              metricName: 'engagement_rate',
              currentValue: s.engagementRate,
              baselineValue: b.avgEngage,
              changePct: (spikeRatio - 1) * 100,
              severity: spikeRatio > 5 ? 'critical' : 'warning',
              message: `Post ${s.postId}: engagement ${Math.round(spikeRatio)}x above ${platform} baseline — potential viral content`,
              status: 'active',
            })
          }
        }
      }
    }
  }

  // 2. Revenue anomaly check — 7-day average vs today
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const revenueEvents = await getRevenueEvents(ventureId, sevenDaysAgo.toISOString())
  const charges = revenueEvents.filter((e) => e.eventType === 'charge.succeeded')

  if (charges.length > 0) {
    const totalRevenue = charges.reduce((sum, c) => sum + c.amount, 0)
    const avgDaily = totalRevenue / 7

    // Check today's revenue
    const today = new Date().toISOString().split('T')[0]
    const todayRevenue = charges
      .filter((c) => (c.createdAt ?? '').startsWith(today))
      .reduce((sum, c) => sum + c.amount, 0)

    if (avgDaily > 0) {
      const revDelta = ((todayRevenue - avgDaily) / (avgDaily || 1)) * 100
      if (Math.abs(revDelta) > thresholds.revenue_anomaly.pct) {
        alerts.push({
          ventureId,
          alertType: 'revenue_anomaly',
          metricName: 'daily_revenue',
          currentValue: todayRevenue,
          baselineValue: avgDaily,
          changePct: revDelta,
          severity: revDelta < -60 ? 'critical' : 'warning',
          message: `Today's revenue ${todayRevenue / 100} ${revDelta < 0 ? 'below' : 'above'} 7-day avg ${Math.round(avgDaily) / 100}`,
          status: 'active',
        })
      }
    }
  }

  // 3. Audience momentum — 3 consecutive weeks decline
  const momentum = await getAudienceMomentum(ventureId, undefined, 12)
  if (momentum.length >= thresholds.audience_dip.weeks) {
    const recent = momentum.slice(0, thresholds.audience_dip.weeks)
    const allDeclining = recent.every((m) => m.trendDirection === 'down')
    if (allDeclining) {
      alerts.push({
        ventureId,
        alertType: 'sentiment_shift',
        metricName: 'follower_engagement_quality',
        currentValue: recent[0].followerQualityScore,
        baselineValue: recent[thresholds.audience_dip.weeks - 1].followerQualityScore,
        changePct: 0,
        severity: 'warning',
        message: `Audience engagement quality declining ${thresholds.audience_dip.weeks} weeks in a row. Review content strategy.`,
        status: 'active',
      })
    }
  }

  // Write alerts to Supabase
  for (const alert of alerts) {
    try {
      await createAnomalyAlert(alert)
    } catch {
      // Best effort — don't fail the whole check
    }
  }

  return Response.json({
    ventureId,
    thresholds,
    alertsGenerated: alerts.length,
    alerts,
    checkedAt: new Date().toISOString(),
  })
}
