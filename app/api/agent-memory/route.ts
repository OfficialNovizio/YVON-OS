/**
 * /api/agent-memory — CRUD for per-agent MEMORY content stored in Supabase.
 *
 * GET    /api/agent-memory                      → list all agents (length + updated_at)
 * GET    /api/agent-memory?agentId=marcus-ceo   → full content for one agent
 * POST   /api/agent-memory { agentId, content } → upsert
 */

import { NextRequest } from 'next/server'
import { getAgentMemoryRaw, setAgentMemory, listAgentMemoryStatus } from '@/lib/agent-memory'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  try {
    if (agentId) {
      const row = await getAgentMemoryRaw(agentId)
      if (!row) return Response.json({ row: { agentId, content: '', updatedAt: new Date(0).toISOString() } })
      return Response.json({ row })
    }
    const status = await listAgentMemoryStatus()
    return Response.json({ status })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let body: { agentId?: string; content?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { agentId, content } = body
  if (!agentId) return Response.json({ error: 'agentId required' }, { status: 400 })

  try {
    await setAgentMemory(agentId, content ?? '')
    return Response.json({ ok: true, agentId })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
