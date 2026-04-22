import { getDeliverables, createDeliverable } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import type { Deliverable, DeliverableType, AgentId } from '@/lib/types'

export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''
  if (!ventureId) return Response.json({ error: 'ventureId is required' }, { status: 400 })

  try {
    const deliverables = await getDeliverables(ventureId)
    return Response.json(deliverables)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<Omit<Deliverable, 'id' | 'createdAt'>>
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId, title, type, content, agentId, status = 'draft' } = body

  if (!ventureId || !title || !type) {
    return Response.json({ error: 'ventureId, title, and type are required' }, { status: 400 })
  }

  try {
    const deliverable = await createDeliverable({
      ventureId,
      title,
      type: type as DeliverableType,
      content,
      agentId: agentId as AgentId | undefined,
      status,
    })

    await logActivity({
      ventureId,
      agentId: agentId as AgentId | undefined,
      type: 'deliverable_saved',
      message: `Deliverable saved: "${title}"`,
      metadata: { deliverableId: deliverable.id, type },
    })

    return Response.json(deliverable, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
