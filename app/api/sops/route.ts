import { getSops, createSop, updateSop } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import type { SopDoc, SopCategory, AgentId } from '@/lib/types'

export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''
  if (!ventureId) return Response.json({ error: 'ventureId is required' }, { status: 400 })

  try {
    const sops = await getSops(ventureId)
    return Response.json(sops)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<Omit<SopDoc, 'id' | 'createdAt' | 'updatedAt'>>
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId, title, content, category = 'general', agentId } = body

  if (!ventureId || !title) {
    return Response.json({ error: 'ventureId and title are required' }, { status: 400 })
  }

  try {
    const sop = await createSop({
      ventureId,
      title,
      content,
      category: category as SopCategory,
      agentId: agentId as AgentId | undefined,
    })

    await logActivity({
      ventureId,
      agentId: agentId as AgentId | undefined,
      type: 'sop_created',
      message: `SOP created: "${title}"`,
      metadata: { sopId: sop.id, category },
    })

    return Response.json(sop, { status: 201 })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id?: string } & Partial<Pick<SopDoc, 'title' | 'content' | 'category' | 'agentId'>>
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, ...rest } = body
  if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

  try {
    await updateSop(id, rest)
    return Response.json({ updated: true })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 })
  }
}
