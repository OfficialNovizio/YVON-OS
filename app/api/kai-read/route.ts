import { callSynthesis } from '@/lib/ai-client'
import { getAgent } from '@/lib/agents'

export async function POST(request: Request): Promise<Response> {
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
    const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 300 })

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
