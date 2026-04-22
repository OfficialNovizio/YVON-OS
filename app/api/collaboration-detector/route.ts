// Collaboration Opportunity Detector — finds adjacent-niche brands for collab
// GET: returns collaboration suggestions

import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const brandName = searchParams.get('brand') ?? ''
  if (!brandName) return Response.json({ error: 'brand query param required' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a collaboration opportunity detector. Find 5 adjacent-niche brands that would be valuable collaboration partners for ${brandName}.

These should NOT be direct competitors, but adjacent brands that share some audience overlap.
For each brand, suggest a specific collaboration idea.

Return ONLY valid JSON array:
[{
  "brandName": "name",
  "niche": "their niche",
  "audienceOverlap": "why audiences overlap",
  "collabIdea": "specific collaboration concept",
  "expectedReach": "estimated combined reach",
  "urgency": "high/medium/low"
}]`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const collabs = JSON.parse(raw) as Array<Record<string, string>>

    return Response.json({ ventureId, brandName, collaborations: collabs })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}