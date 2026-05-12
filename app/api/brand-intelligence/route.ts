import { callSynthesis } from '@/lib/ai-client'
import { getSocialStats } from '@/lib/db'
import { getAgent } from '@/lib/agents'
import { cookies } from 'next/headers'

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { ventureName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    body = {}
  }
  const ventureName = body.ventureName ?? 'Novizio'

  const [ig, yt, li] = await Promise.all([
    getSocialStats(ventureId, 'instagram').catch(() => null),
    getSocialStats(ventureId, 'youtube').catch(() => null),
    getSocialStats(ventureId, 'linkedin').catch(() => null),
  ])

  const socialData = { instagram: ig, youtube: yt, linkedin: li }

  const kai = getAgent('kai-analyst')
  const lena = getAgent('lena-brand')

  if (!kai || !lena) {
    return Response.json({ error: 'Required agents not found' }, { status: 500 })
  }

  // Kai analyses the social data
  let kaiInsight = {
    topInsight: 'Insufficient data — refresh social stats first.',
    contentOpportunity: 'Connect social accounts to get content recommendations.',
    urgency: 'low',
  }
  try {
    const raw = await callSynthesis({
      messages: [{
        role: 'user',
        content: `${kai.systemPrompt}

Analyse this social data for ${ventureName} and return JSON:
${JSON.stringify(socialData, null, 2)}

Return exactly:
{
  "topInsight": "one sentence: the most important thing the data is telling us",
  "contentOpportunity": "one sentence: the specific content opportunity right now",
  "urgency": "high or medium or low"
}
Return ONLY valid JSON.`,
      }],
      maxTokens: 400,
    })
    kaiInsight = JSON.parse(raw) as typeof kaiInsight
  } catch { /* keep default */ }

  // Lena generates content brief from Kai's insight
  let brief: Record<string, string> = {}
  try {
    const raw = await callSynthesis({
      messages: [{
        role: 'user',
        content: `${lena.systemPrompt}

Venture: ${ventureName}
Kai's data insight: ${kaiInsight.topInsight}
Content opportunity: ${kaiInsight.contentOpportunity}

Generate a ready-to-act content brief as JSON:
{
  "headline": "the content hook or post headline",
  "format": "reel or carousel or post",
  "platform": "instagram or linkedin",
  "angle": "the core narrative angle in one sentence",
  "caption": "full ready-to-post caption",
  "cta": "call to action"
}
Return ONLY valid JSON.`,
      }],
      maxTokens: 600,
    })
    brief = JSON.parse(raw) as Record<string, string>
  } catch { /* keep empty */ }

  return Response.json({
    ventureId,
    ventureName,
    socialData,
    kaiInsight,
    brief,
    generatedAt: new Date().toISOString(),
  })
}
