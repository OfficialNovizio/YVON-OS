// GET /api/isaac/scan
// Isaac Trend Detection — scrapes and analyzes trend sources for
// workspace relevance. Cron-secured for automated daily scans.
//
// Query params:
//   sources — comma-separated list of source names (optional)
//
// Response: { trends: TrendSignal[], stats, scannedAt, source }

import { NextResponse } from 'next/server'
import { detectTrends } from '@/lib/isaac'
import { getSecret } from '@/lib/secrets'

export const runtime = 'nodejs'

export async function GET(request: Request): Promise<Response> {
  try {
    // Cron security — require CRON_SECRET Bearer token
    const cronSecret = await getSecret('CRON_SECRET')
    if (cronSecret) {
      const auth = request.headers.get('authorization')
      if (!auth || auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized — valid CRON_SECRET required' },
          { status: 401 }
        )
      }
    }

    // Optional sources filter
    const url = new URL(request.url)
    const sourcesParam = url.searchParams.get('sources')
    const sources = sourcesParam
      ? sourcesParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    const result = await detectTrends(sources)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[isaac/scan GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
