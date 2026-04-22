import Anthropic from '@anthropic-ai/sdk'
import { getAgent } from '@/lib/agents'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: { metrics?: Record<string, unknown>; ventureId?: string; ventureName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { metrics = {}, ventureId = 'novizio', ventureName = 'Novizio' } = body

  const kai = getAgent('kai-analyst')
  if (!kai) return Response.json({ error: 'Kai agent not found' }, { status: 500 })

  const prompt = `${kai.systemPrompt}

You are reviewing the latest metrics for ${ventureName}. Venture ID: ${ventureId}.

DATA:
${JSON.stringify(metrics, null, 2)}

Return a JSON object with exactly these keys:
{
  "what": "one sentence: what happened in the data",
  "why": "one sentence: why this matters for the business",
  "action": "one sentence: the single most important action to take now",
  "confidence": "high or medium or low based on data completeness"
}

Return ONLY valid JSON. No markdown, no explanation, no code fences.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return Response.json({ error: 'AI returned invalid JSON', raw }, { status: 502 })
    }

    return Response.json(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
