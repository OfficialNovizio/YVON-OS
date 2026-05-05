import { getInsights } from '@/lib/db'
import type { AgentId } from '@/lib/types'

export const maxDuration = 30

// GET /api/insights?venture=Novizio&days=30&agent=kai-analyst
// Returns aggregated token usage, cost, session counts and top skills

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const venture = searchParams.get('venture') ?? 'Novizio'
  const days    = Math.min(parseInt(searchParams.get('days') ?? '30'), 365)
  const agentId = searchParams.get('agent') as AgentId | undefined ?? undefined

  try {
    const data = await getInsights(venture, days, agentId)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
