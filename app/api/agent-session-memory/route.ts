/**
 * /api/agent-session-memory — Rolling 50-session history per agent.
 *
 * Called by Claude during ADJOURNING to persist session learnings.
 * Auto-pruned to 50 rows per agent (DB trigger).
 *
 * POST { agentId, venture?, summary, learnings?, corrections?, filesChanged?, toolCallsCount? }
 *   → saves one session entry
 * GET  ?agentId=X&limit=N
 *   → returns last N sessions (max 50)
 */

import { NextRequest } from 'next/server'
import { saveSessionMemory, getSessionHistory } from '@/lib/agent-memory'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (!agentId) return Response.json({ error: 'agentId required' }, { status: 400 })

  try {
    const history = await getSessionHistory(agentId, limit)
    return Response.json({ history })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  interface Body {
    agentId?:        string
    venture?:        string
    summary?:        string
    learnings?:      string[]
    corrections?:    string[]
    filesChanged?:   string[]
    toolCallsCount?: number
  }

  let body: Body
  try { body = await request.json() as Body }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.agentId) return Response.json({ error: 'agentId required' }, { status: 400 })
  if (!body.summary)  return Response.json({ error: 'summary required' },  { status: 400 })

  try {
    await saveSessionMemory(body.agentId, {
      venture:        body.venture,
      summary:        body.summary,
      learnings:      body.learnings,
      corrections:    body.corrections,
      filesChanged:   body.filesChanged,
      toolCallsCount: body.toolCallsCount,
    })
    return Response.json({ ok: true, agentId: body.agentId })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
