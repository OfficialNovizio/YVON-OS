import { getAllVentures, createVenture, updateVenture } from '@/lib/db'
import type { VentureConfig } from '@/lib/types'

export async function GET(): Promise<Response> {
  try {
    const ventures = await getAllVentures()
    return Response.json(ventures)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<Omit<VentureConfig, 'id'>>
  try {
    body = await request.json() as Partial<Omit<VentureConfig, 'id'>>
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, slug, color, igHandle = '', ytChannelId = '', liProfileUrl = '', ga4PropertyId = '' } = body

  if (!name || !slug) {
    return Response.json({ error: 'name and slug are required' }, { status: 400 })
  }

  try {
    const venture = await createVenture({
      name,
      slug,
      color: color ?? '#E94560',
      igHandle,
      ytChannelId,
      liProfileUrl,
      ga4PropertyId,
    })
    return Response.json(venture, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  let body: Partial<VentureConfig>
  try {
    body = await request.json() as Partial<VentureConfig>
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, ...rest } = body
  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    await updateVenture(id, rest)
    return Response.json({ updated: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
