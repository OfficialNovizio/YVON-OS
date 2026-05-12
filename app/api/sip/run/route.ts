/**
 * POST /api/sip/run
 * Execute SIP (Skill Improvement Protocol) for an agent
 *
 * Body: { agentId: string }
 * Returns: { success: boolean, agentId: string, distillation: string }
 */

import { NextRequest } from 'next/server'
import { resolveSip } from '@/lib/sip-manager'
import { getAgent } from '@/lib/agents'
import type { AgentId } from '@/lib/types'
import { callSynthesis } from '@/lib/ai-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { agentId?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId } = body

  if (!agentId) {
    return Response.json({ error: 'agentId is required' }, { status: 400 })
  }

  try {
    const agent = getAgent(agentId as AgentId)
    if (!agent) {
      return Response.json({ error: 'Agent not found' }, { status: 404 })
    }

    const sipPrompt = `
You are ${agent.name}, ${agent.role} at YVON.
Your task is to distill recent session learnings into the SKILLS.md file.

## Current Session Count (reaching SIP threshold)
Analyze recent sessions for patterns to keep, stale patterns to remove, and new discoveries.

## SIP Protocol Instructions
1. Identify ONE new pattern, command, or file discovered that should be added to SKILLS.md
2. Identify ONE existing rule/command that is wrong, stale, or replaced
3. Formulate the exact SKILLS.md update required

## Format Response
Return JSON ONLY:
{
  "addPattern": "exact text to append to SKILLS.md",
  "removePattern": "exact text pattern to remove from SKILLS.md",
  "reason": "one sentence explaining why this improves the system"
}

## Constraints
- Do not increase total token count in SKILLS.md
- If you add one line, condense or remove one line
- Focus on quality over quantity
- Consider both technical patterns and workflow protocols

Recent sessions should be analyzed for:
- Recurring error patterns
- New file discoveries
- Improved workflow steps
- Deprecated commands
- Stale references
`

    const rawContent = await callSynthesis({
      messages: [{ role: 'user', content: sipPrompt }],
      maxTokens: 500,
    })

    let distillation
    try {
      distillation = JSON.parse(rawContent)
    } catch {
      distillation = { error: 'Could not parse response', raw: rawContent }
    }

    await resolveSip(agentId)

    return Response.json({
      success: true,
      agentId,
      distillation,
      note: 'Apply this distillation to SKILLS.md manually or via skill-creator tool'
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ error: `SIP execution failed: ${msg}` }, { status: 500 })
  }
}

export async function GET() {
  const { getPendingSips, getOverdueSips } = await import('@/lib/sip-manager')

  try {
    const pending = await getPendingSips()
    const overdue = await getOverdueSips()

    return Response.json({
      pending: pending.length,
      overdue: overdue.length,
      pendingAgents: pending.map(p => p.agentId),
      overdueAgents: overdue.map(o => o.agentId)
    })
  } catch (error) {
    return Response.json({ error: 'Failed to get SIP status' }, { status: 500 })
  }
}
