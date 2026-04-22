import Anthropic from '@anthropic-ai/sdk'
import { createBrief } from '@/lib/db'
import { getAgent } from '@/lib/agents'
import { getVentureConfig } from '@/lib/venture-context'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(request: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const url = new URL(request.url)
  const ventureSlug = url.searchParams.get('venture') ?? 'novizio'
  const venture = getVentureConfig(ventureSlug)

  const marcus = getAgent('marcus-ceo')
  const kai    = getAgent('kai-analyst')
  const nate   = getAgent('nate-growth')

  // Kai and Nate provide analytics section
  const [kaiResponse, nateResponse] = await Promise.allSettled([
    client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `${kai?.systemPrompt ?? ''}\n\nVenture: ${venture.name}\n\nProvide today's analytics summary in 100 words or less. Focus on what changed, what's trending, and what needs attention.`,
      }],
    }),
    client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `${nate?.systemPrompt ?? ''}\n\nVenture: ${venture.name}\n\nProvide the top 3 growth opportunities you see right now, in 100 words or less.`,
      }],
    }),
  ])

  const kaiText  = kaiResponse.status === 'fulfilled'
    ? kaiResponse.value.content[0]?.type === 'text' ? kaiResponse.value.content[0].text : ''
    : 'Analytics unavailable.'
  const nateText = nateResponse.status === 'fulfilled'
    ? nateResponse.value.content[0]?.type === 'text' ? nateResponse.value.content[0].text : ''
    : 'Growth data unavailable.'

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

  const briefResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: synthesisPrompt }],
  })

  const briefContent = briefResponse.content[0]?.type === 'text'
    ? briefResponse.content[0].text
    : 'Brief generation failed.'

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
