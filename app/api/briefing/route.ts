import { callFast, callSynthesis } from '@/lib/ai-client'
import { createBrief, getVentureBySlug } from '@/lib/db'
import { getAgent } from '@/lib/agents'

export const maxDuration = 60

export async function GET(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const ventureSlug = url.searchParams.get('venture') ?? 'novizio'
  const venture = (await getVentureBySlug(ventureSlug)) ?? {
    id: ventureSlug, name: ventureSlug, slug: ventureSlug,
    color: '#E94560', igHandle: '', ytChannelId: '', liProfileUrl: '', ga4PropertyId: '',
  }

  const marcus = getAgent('marcus-ceo')
  const kai    = getAgent('kai-analyst')
  const nate   = getAgent('nate-growth')

  // Kai and Nate provide analytics section
  const [kaiResponse, nateResponse] = await Promise.allSettled([
    callFast({
      messages: [{
        role: 'user',
        content: `${kai?.systemPrompt ?? ''}\n\nVenture: ${venture.name}\n\nProvide today's analytics summary in 100 words or less. Focus on what changed, what's trending, and what needs attention.`,
      }],
      maxTokens: 300,
    }),
    callFast({
      messages: [{
        role: 'user',
        content: `${nate?.systemPrompt ?? ''}\n\nVenture: ${venture.name}\n\nProvide the top 3 growth opportunities you see right now, in 100 words or less.`,
      }],
      maxTokens: 300,
    }),
  ])

  const kaiText  = kaiResponse.status === 'fulfilled' ? kaiResponse.value : 'Analytics unavailable.'
  const nateText = nateResponse.status === 'fulfilled' ? nateResponse.value : 'Growth data unavailable.'

  // Marcus synthesizes
  const synthesisPrompt = `${marcus?.systemPrompt ?? ''}

Venture: ${venture.name}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Kai (Analytics) reports:
${kaiText}

Nate (Growth) reports:
${nateText}

Write the morning CEO brief for the ${venture.name} team. Keep it under 300 words. Format:
1. Key metrics snapshot (2-3 sentences)
2. Top priority for today (1-2 sentences)
3. Action items (3 bullet points max)
4. Closing outlook (1 sentence)`

  const briefContent = await callSynthesis({
    messages: [{ role: 'user', content: synthesisPrompt }],
    maxTokens: 800,
  }).catch(() => 'Brief generation failed.')

  // Persist to Supabase
  const briefId = await createBrief(venture.id, briefContent)

  // Optionally send email
  const sendEmail = url.searchParams.get('email') === 'true'
  if (sendEmail && process.env.RESEND_API_KEY && process.env.BRIEFING_EMAIL) {
    await fetch(new URL('/api/email', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefId,
        ventureId: venture.id,
        ventureName: venture.name,
        content: briefContent,
      }),
    })
  }

  return Response.json({ briefId, content: briefContent, venture: venture.slug })
}
