// GET /api/agent-personality?agentId=marcus
// Returns the personality baseline and model for a given agent.
//
// Accepts both short IDs ("marcus", "diana") and full AgentIds ("marcus-ceo").
// Returns { personality: string, model: string, agentId: string, name: string }
// or 400/404 on missing or unknown agent.

import { getAgentPersonality } from '@/lib/agent-personalities'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return Response.json(
      { error: 'agentId query parameter is required' },
      { status: 400 }
    )
  }

  const personality = getAgentPersonality(agentId)

  if (!personality) {
    return Response.json(
      { error: `Unknown agent: "${agentId}"` },
      { status: 404 }
    )
  }

  return Response.json({
    personality: personality.personality,
    model: personality.model,
    agentId: personality.agentId,
    name: personality.name,
  })
}
