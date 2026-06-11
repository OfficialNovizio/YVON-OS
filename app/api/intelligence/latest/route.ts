// GET /api/intelligence/latest?ventureId=x
// Returns the latest intelligence batch with its 5 ranked proposals + source report summaries.
// Falls back to demo data when no live data exists — remove demo import when live.

import { cookies } from 'next/headers'
import { getLatestReports } from '@/lib/reports'
import { getLatestBatch, getPitchesByBatch } from '@/lib/intelligence'
import { mockReports, mockBatch, mockPitches } from '@/lib/demo'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''

  const cookieStore = await cookies()
  const vId = ventureId || (cookieStore.get('yvon_active_venture')?.value ?? 'novizio')

  try {
    const [batch, reports] = await Promise.all([
      getLatestBatch(vId),
      getLatestReports(vId),
    ])

    if (!batch) {
      // ═══ DEMO FALLBACK ═══
      // Remove this block when live data is flowing from cron-generated reports
      return Response.json({
        hasData: true,
        isDemo: true,
        batch: {
          id: mockBatch.id,
          number: mockBatch.batchNumber,
          status: mockBatch.status,
          createdAt: mockBatch.createdAt,
        },
        pitches: mockPitches.map((p) => ({
          id: p.id,
          rank: p.rank,
          platform: p.platform,
          format: p.format,
          category: p.category,
          hookA: p.hookA,
          hookB: p.hookB,
          leverPrimary: p.leverPrimary,
          psychologyScore: p.psychologyScore,
          system1ScoreA: p.system1ScoreA,
          system1ScoreB: p.system1ScoreB,
          runRecommendation: p.runRecommendation,
          marketEffect: p.marketEffect,
          vsCurrent: p.vsCurrent,
          viralMechanism: p.viralMechanism,
          status: p.status,
        })),
        sourceReports: {
          analytics: {
            id: mockReports.analytics.id,
            title: mockReports.analytics.title,
            summary: mockReports.analytics.summary.slice(0, 300),
            createdAt: mockReports.analytics.createdAt,
            reportNumber: mockReports.analytics.reportNumber,
          },
          marketing: {
            id: mockReports.marketing.id,
            title: mockReports.marketing.title,
            summary: mockReports.marketing.summary.slice(0, 300),
            createdAt: mockReports.marketing.createdAt,
            reportNumber: mockReports.marketing.reportNumber,
          },
          competitor: {
            id: mockReports.competitor.id,
            title: mockReports.competitor.title,
            summary: mockReports.competitor.summary.slice(0, 300),
            createdAt: mockReports.competitor.createdAt,
            reportNumber: mockReports.competitor.reportNumber,
          },
        },
      })
    }

    const pitches = await getPitchesByBatch(batch.id)

    return Response.json({
      hasData: true,
      batch: {
        id: batch.id,
        number: batch.batchNumber,
        status: batch.status,
        createdAt: batch.createdAt,
      },
      pitches: pitches.map((p) => ({
        id: p.id,
        rank: p.rank,
        platform: p.platform,
        format: p.format,
        category: p.category,
        hookA: p.hookA,
        hookB: p.hookB,
        leverPrimary: p.leverPrimary,
        psychologyScore: p.psychologyScore,
        system1ScoreA: p.system1ScoreA,
        system1ScoreB: p.system1ScoreB,
        runRecommendation: p.runRecommendation,
        marketEffect: p.marketEffect,
        vsCurrent: p.vsCurrent,
        viralMechanism: p.viralMechanism,
        status: p.status,
      })),
      sourceReports: {
        analytics: reports.analytics ? {
          id: reports.analytics.id,
          title: reports.analytics.title,
          summary: reports.analytics.summary.slice(0, 300),
          createdAt: reports.analytics.createdAt,
          reportNumber: reports.analytics.reportNumber,
        } : null,
        marketing: reports.marketing ? {
          id: reports.marketing.id,
          title: reports.marketing.title,
          summary: reports.marketing.summary.slice(0, 300),
          createdAt: reports.marketing.createdAt,
          reportNumber: reports.marketing.reportNumber,
        } : null,
        competitor: reports.competitor ? {
          id: reports.competitor.id,
          title: reports.competitor.title,
          summary: reports.competitor.summary.slice(0, 300),
          createdAt: reports.competitor.createdAt,
          reportNumber: reports.competitor.reportNumber,
        } : null,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
