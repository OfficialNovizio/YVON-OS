import { callFast } from '@/lib/ai-client'
import type { RoutingResult } from '@/lib/types'

const CLASSIFIER_PROMPT = `You are a routing classifier for an AI team. Analyze the user's message and return JSON only — no explanation.

Available intents: strategy, marketing_content, social_tactics, content_create, growth_data, competitor_intel, technical_backend, technical_frontend, technical_general, qa_review, trending_content, operations, product_roadmap, advertising

Available specialists: marcus-ceo, diana-coo, lena-brand, rio-ads, atlas-art-director, pixel-production, kai-analyst, nate-growth, dev-lead, raj-backend, mia-frontend, quinn-qa, felix-finance

Intent guidance:
- technical_backend: API routes, database, Supabase, server-side logic, integrations, data models
- technical_frontend: UI components, styling, Tailwind, animations, design system, layout, responsiveness
- technical_general: architecture decisions, full-stack features, or unclear which layer
- qa_review: testing, bugs, code review, pre-ship checks, edge cases

Return exactly: { "intent": "<intent>", "specialists": ["<id1>", "<id2>"], "reasoning": "<one sentence>" }
Pick 2 specialists maximum unless the question clearly spans 3 domains. Always return valid JSON.`

export async function POST(request: Request): Promise<Response> {
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
    const text = await callFast({
      messages: [{
        role: 'user',
        content: `${CLASSIFIER_PROMPT}\n\nActive venture: ${activeVentureName} (id: ${ventureId})\n\nUser message: ${message}`,
      }],
      maxTokens: 256,
    })
    const result = JSON.parse(text) as RoutingResult
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
