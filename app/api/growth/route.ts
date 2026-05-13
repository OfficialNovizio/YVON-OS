import { getGrowthSummary, setGrowthBaseline } from '@/lib/db'

// GET /api/growth?ventureId=novizio
// Returns growth metrics: current vs baseline + 30-day history for each tracked metric
export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? 'novizio'

  try {
    const metrics = await getGrowthSummary(ventureId)
    return Response.json({ ventureId, metrics })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// POST /api/growth
// Manually reset a baseline. Body: { ventureId, platform, metricKey, value, notes? }
export async function POST(request: Request): Promise<Response> {
  let body: { ventureId?: string; platform?: string; metricKey?: string; value?: number; notes?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId, platform, metricKey, value, notes } = body

  if (!ventureId || !platform || !metricKey || value == null) {
    return Response.json(
      { error: 'ventureId, platform, metricKey, and value are required' },
      { status: 400 }
    )
  }

  try {
    await setGrowthBaseline(ventureId, platform, metricKey, value, notes)
    return Response.json({ ok: true, ventureId, platform, metricKey, value })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
