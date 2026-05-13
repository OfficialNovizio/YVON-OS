import { getAnalyticsReport } from '@/lib/google-analytics'
import { getVentureConfig } from '@/lib/venture-context'
import { setAnalyticsReport, insertAnalyticsSnapshot } from '@/lib/db'

export async function GET(request: Request): Promise<Response> {
  if (!process.env.GOOGLE_SA_JSON) {
    return Response.json({ error: 'GOOGLE_SA_JSON must be set' }, { status: 500 })
  }

  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? 'novizio'
  const venture   = getVentureConfig(ventureId)
  const propertyId = venture.ga4PropertyId || process.env.GA4_PROPERTY_ID

  if (!propertyId) {
    return Response.json({ error: 'GA4 property ID not configured for this venture' }, { status: 500 })
  }

  try {
    const report = await getAnalyticsReport(propertyId)
    // Persist to DB: legacy table (for CEO brief reads) + snapshot (for growth tracking)
    try {
      await Promise.all([
        setAnalyticsReport(ventureId, report),
        insertAnalyticsSnapshot(ventureId, report as unknown as Record<string, unknown>),
      ])
    } catch { /* persistence failure must not fail the response */ }
    return Response.json(report)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
