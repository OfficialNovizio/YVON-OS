import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { getAnomalyAlerts, getTopContent } from '@/lib/db-phase1'

// GET returns top-performing posts by format
export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? ''
  const limit = searchParams.get('limit') ?? '10'

  const top = await getTopContent(ventureId, parseInt(limit))
  let filtered = top

  if (format) {
    filtered = top.filter((c) => c.platform.toLowerCase().includes(format.toLowerCase()))
  }

  return Response.json({
    ventureId,
    format,
    posts: filtered,
    totalRevenue: filtered.length > 0
      ? filtered.reduce((sum, c) => sum + (c as { compositeScore: number }).compositeScore, 0)
      : 0,
    avgScore: filtered.length > 0
      ? filtered.reduce((sum, c) => sum + c.compositeScore, 0) / filtered.length
      : 0,
  })
}