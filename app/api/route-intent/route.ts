import Anthropic from '@anthropic-ai/sdk'
import type { RoutingResult } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CLASSIFIER_PROMPT = `You are a routing classifier for an AI team. Analyze the user's message and return JSON only — no explanation.

Available intents: strategy, marketing_content, social_tactics, content_create, growth_data, competitor_intel, technical_backend, technical_frontend, technical_general, qa_review, trending_content, operations, product_roadmap, advertising

Available specialists: marcus-ceo, diana-coo, sofia-social, lena-brand, rio-ads, atlas-art-director, kai-analyst, zara-competitor, nate-growth, dev-lead, raj-backend, mia-frontend, quinn-qa, felix-finance

Intent guidance:
- technical_backend: API routes, database, Supabase, server-side logic, integrations, data models
- technical_frontend: UI components, styling, Tailwind, animations, design system, layout, responsiveness
- technical_general: architecture decisions, full-stack features, or unclear which layer
- qa_review: testing, bugs, code review, pre-ship checks, edge cases

Return exactly: { "intent": "<intent>", "specialists": ["<id1>", "<id2>"], "reasoning": "<one sentence>" }
Pick 2 specialists maximum unless the question clearly spans 3 domains. Always return valid JSON.`

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let message: string
  let ventureId: string
  let activeVentureName: string
  try {
    const body = await request.json() as {
      message?: string
      ventureId?: string
      activeVentureName?: string
    }
    message          = body.message ?? ''
    ventureId        = body.ventureId ?? ''
    activeVentureName = body.activeVentureName ?? 'Novizio'
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `${CLASSIFIER_PROMPT}\n\nActive venture: ${activeVentureName} (id: ${ventureId})\n\nUser message: ${message}`,
        },
      ],
    })

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const result = JSON.parse(text) as RoutingResult
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
