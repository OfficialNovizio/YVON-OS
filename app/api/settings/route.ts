import { getAllAgentSettings, saveAgentSettings, getAgentMemory, setAgentMemory, deleteAgentMemory } from '@/lib/db'
import type { AgentSettingsSave, AgentId } from '@/lib/types'

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? ''
  const type      = url.searchParams.get('type')
  const agentId   = url.searchParams.get('agentId') ?? ''

  if (!ventureId) {
    return Response.json({ error: 'ventureId is required' }, { status: 400 })
  }

  try {
    if (type === 'memory') {
      if (!agentId) return Response.json({ error: 'agentId is required for memory' }, { status: 400 })
      const mem = await getAgentMemory(agentId, ventureId)
      const entries = Object.entries(mem).map(([key, value]) => ({ key, value: String(value) }))
      return Response.json(entries)
    }

    const settings = await getAllAgentSettings(ventureId)
    return Response.json(settings)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, string>
  try {
    body = await request.json() as Record<string, string>
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId = '', agentId = '', type, key, value, model = '', systemPromptExtension = '' } = body

  if (!ventureId || !agentId) {
    return Response.json({ error: 'ventureId and agentId are required' }, { status: 400 })
  }

  try {
    if (type === 'memory') {
      if (!key || value === undefined) {
        return Response.json({ error: 'key and value are required for memory' }, { status: 400 })
      }
      await setAgentMemory(agentId, ventureId, key, value)
      return Response.json({ saved: true })
    }

    if (!model) {
      return Response.json({ error: 'model is required for settings' }, { status: 400 })
    }
    const settings: AgentSettingsSave = { agentId: agentId as AgentId, model, systemPromptExtension }
    await saveAgentSettings(ventureId, settings)
    return Response.json({ saved: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function DELETE(request: Request): Promise<Response> {
  let body: Record<string, string>
  try {
    body = await request.json() as Record<string, string>
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureId = '', agentId = '', key = '' } = body

  if (!ventureId || !agentId || !key) {
    return Response.json({ error: 'ventureId, agentId, and key are required' }, { status: 400 })
  }

  try {
    await deleteAgentMemory(agentId, ventureId, key)
    return Response.json({ deleted: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
