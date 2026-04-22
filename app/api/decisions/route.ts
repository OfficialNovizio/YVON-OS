import { getDecisions, createDecision, resolveDecision } from '@/lib/db'
import type { DecisionAction, DecisionUrgency } from '@/lib/types'
import { cookies } from 'next/headers'

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { searchParams } = new URL(request.url)
  const resolvedParam = searchParams.get('resolved')

  const resolved =
    resolvedParam === 'true' ? true :
    resolvedParam === 'false' ? false :
    undefined

  try {
    const decisions = await getDecisions(ventureId, { resolved, limit: 20 })
    return Response.json({ decisions })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: {
    agentId?: string
    decisionText?: string
    question?: string
    urgency?: DecisionUrgency
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.agentId || !body.decisionText) {
    return Response.json({ error: 'agentId and decisionText are required' }, { status: 400 })
  }

  try {
    const decision = await createDecision({
      ventureId,
      agentId: body.agentId,
      decisionText: body.decisionText,
      question: body.question,
      urgency: body.urgency ?? 'this-week',
    })
    return Response.json({ decision })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string; action?: DecisionAction }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id || !body.action) {
    return Response.json({ error: 'id and action are required' }, { status: 400 })
  }

  const validActions: DecisionAction[] = ['approved', 'rejected', 'deferred']
  if (!validActions.includes(body.action)) {
    return Response.json({ error: 'action must be approved, rejected, or deferred' }, { status: 400 })
  }

  try {
    await resolveDecision(body.id, body.action)
    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
