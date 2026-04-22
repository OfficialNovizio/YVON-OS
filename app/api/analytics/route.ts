import { getAnalyticsReport } from '@/lib/google-analytics'
import { getVentureConfig } from '@/lib/venture-context'

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
    return Response.json(report)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
