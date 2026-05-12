// Community Intelligence Scanner — Reddit, TikTok comments extraction
// POST: runs a scan and extracts audience signals

import { cookies } from 'next/headers'
import { callFast } from '@/lib/ai-client'
import { upsertCommunitySignal, getCommunitySignals } from '@/lib/community-intelligence'

// GET /api/community-scan
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const signals = await getCommunitySignals(ventureId)
  return Response.json({ ventureId, signals, count: signals.length })
}

// POST /api/community-scan
export async function POST(request: Request): Promise<Response> {
  let body: { platform?: string; text?: string; brandName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const platform = body.platform ?? 'reddit'

  if (platform === 'reddit' && body.text) {
    const prompt = `Analyze this Reddit thread for audience signals about ${body.brandName ?? 'this brand'}:

${body.text}

Extract:
1. What is the user asking for or complaining about?
2. What emotional state are they in?
3. What content/product gap does this reveal?

Return ONLY valid JSON array of signals:
[{
  "topic": "what they're talking about",
  "sentiment": "positive/negative/requesting/neutral",
  "extractedDesire": "what they want that they're not getting",
  "urgency": "high/medium/low"
}]`

    try {
      const raw = await callFast({ messages: [{ role: 'user', content: prompt }], maxTokens: 1000 })
      const signals = JSON.parse(raw) as Array<{
        topic: string
        sentiment: string
        extractedDesire: string
        urgency: string
      }>

      for (const s of signals) {
        await upsertCommunitySignal({
          ventureId,
          source: platform,
          topic: s.topic,
          sentiment: s.sentiment,
          extractedDesire: s.extractedDesire,
        })
      }

      return Response.json({ scanned: platform, signalsFound: signals.length, signals })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return Response.json({ error: msg }, { status: 502 })
    }
  }

  return Response.json({ scanned: platform, signalsFound: 0 })
}
