// Audience Intelligence Loop — Quinn listens → extracts desires → generates briefs
// GET: returns extracted audience desires
// POST: runs audience scan from community data

import { cookies } from 'next/headers'
import { callSynthesis } from '@/lib/ai-client'
import { getCommunitySignals } from '@/lib/community-intelligence'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const signals = await getCommunitySignals(ventureId)
  const desires = new Map<string, { count: number, sources: string[], latest: string }>()
  for (const s of signals) {
    if (s.extractedDesire) {
      const existing = desires.get(s.extractedDesire) ?? { count: 0, sources: [], latest: s.detectedAt }
      existing.count += s.frequency
      existing.sources.push(s.source)
      existing.latest = s.detectedAt
      desires.set(s.extractedDesire, existing)
    }
  }

  return Response.json({
    ventureId,
    signalsFound: signals.length,
    topDesires: Array.from(desires.entries())
      .map(([desire, data]) => ({ desire, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  })
}

export async function POST(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const signals = await getCommunitySignals(ventureId)
  if (signals.length < 2) {
    return Response.json({ error: 'Not enough community signals — need at least 2 extracted desires' }, { status: 400 })
  }

  const desiresText = signals
    .filter((s) => s.extractedDesire)
    .map((s) => `- [${s.source}] "${s.extractedDesire}" (sentiment: ${s.sentiment}, frequency: ${s.frequency})`)
    .join('\n')

  const prompt = `You are Quinn, the community listener. You've extracted these audience signals:

${desiresText}

Generate 3 content briefs directly from audience language. Use their exact words where possible.

For each brief:
1. What the audience is asking for
2. How to create content that speaks in their language
3. The specific hook and format

Return ONLY valid JSON array:
[{
  "desire": "the audience desire this brief addresses",
  "extractionSource": ["reddit", "tiktok_comments"],
  "brief": {
    "title": "content title using audience language",
    "hook": "hook written in their words",
    "format": "reel/post/carousel/thread",
    "platform": "instagram/linkedin/tiktok/youtube",
    "audienceLanguageQuote": "exact phrase or sentiment to echo",
    "cta": "call to action"
  },
  "urgency": "high/medium/low"
}]`

  try {
    const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 3000 })
    const briefs = JSON.parse(raw) as Array<Record<string, unknown>>
    return Response.json({ ventureId, briefsGenerated: briefs.length, briefs })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
