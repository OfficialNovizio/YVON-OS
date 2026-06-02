import { callFast } from '@/lib/ai-client'
import { VENTURE_TECH_STACK } from '@/lib/ventures'
import type { RoutingResult } from '@/lib/types'

function buildClassifierPrompt(ventureName: string, techStack: string): string {
  const isFlutter = techStack.includes('Flutter')
  const dbTech    = techStack.includes('Firebase') ? 'Firebase' : 'Supabase'
  const frameworkTech = isFlutter ? 'Flutter/Dart' : 'Next.js/TypeScript'
  const frontendScope = isFlutter
    ? 'Flutter screens, widgets, navigation, mobile UX, Dart UI code'
    : 'React/Next.js UI components, Tailwind CSS, layout, UX'

  return `You are a routing classifier for a multi-agent AI team. Given the user message and venture context, pick the 2 most qualified specialists. Return JSON only — no explanation.

VENTURE: ${ventureName} — ${techStack}

SPECIALISTS — read each description carefully, then match to the task:
marcus-ceo        — Business strategy, OKRs, executive priorities, final synthesis across all departments
diana-coo         — Operations, project plans, sprint milestones, cross-team process design
dev-lead          — Technical architecture, ${frameworkTech} development, full-stack decisions, code review
raj-backend       — Backend APIs, ${dbTech}, database schema, server logic, auth flows, third-party integrations
mia-frontend      — ${frontendScope}
quinn-qa          — Debugging, error diagnosis, code quality, testing, QA review
lena-brand        — Brand voice, copywriting, captions, email copy, messaging tone
rio-ads           — Paid ads, Meta/TikTok campaigns, ROAS, CPM, ad creative, retargeting
atlas-art-director— Visual identity, art direction, creative briefs, mood boards, brand visuals
pixel-production  — Asset production pipeline, image generation, batch delivery
kai-analyst       — Analytics, metrics, data insights, competitive intelligence, growth data
nate-growth       — Growth experiments, funnel strategy, channel performance, acquisition
felix-finance     — P&L, CAC, LTV, MRR, runway, pricing, financial modeling
daniel-kahneman   — Cognitive bias audit, framing review, decision quality, behavioral economics

INTENT LABELS (use exactly one for the "intent" field):
strategy, operations, marketing_content, social_tactics, content_create, trending_content,
advertising, growth_data, competitor_intel, github_analysis,
technical_backend, technical_frontend, technical_general, qa_review,
product_roadmap, finance, behavioral_audit

HARD RULES (override your reasoning):
1. Any pasted error, stack trace, exception output → qa_review (quinn-qa + dev-lead)
2. Auth error, login not working, ${dbTech} auth error → technical_backend (raj-backend + dev-lead)
3. UI / screen / component / layout / design / styling / UX question → technical_frontend (mia-frontend + dev-lead)

Return exactly: { "intent": "<intent>", "specialists": ["<id1>", "<id2>"], "reasoning": "<one sentence>" }
Pick 2–4 specialists: 2 for focused tasks, 3–4 only when the task genuinely spans multiple domains. Always return valid JSON.`
}

export async function POST(request: Request): Promise<Response> {
  let message: string
  let ventureId: string
  let activeVentureName: string
  let ventureSlug: string
  try {
    const body = await request.json() as {
      message?: string
      ventureId?: string
      activeVentureName?: string
      ventureSlug?: string
    }
    message           = body.message ?? ''
    ventureId         = body.ventureId ?? ''
    activeVentureName = body.activeVentureName ?? 'Novizio'
    ventureSlug       = body.ventureSlug ?? ventureId ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  const techStack        = VENTURE_TECH_STACK[ventureSlug] ?? 'web/mobile app'
  const classifierPrompt = buildClassifierPrompt(activeVentureName, techStack)

  try {
    const text = await callFast({
      messages: [{
        role: 'user',
        content: `${classifierPrompt}\n\nUser message: ${message}`,
      }],
      maxTokens: 1024,
    })
    // Extract JSON robustly — handles markdown code fences and thinking model output
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error(`Classifier returned no JSON. Raw: "${text.slice(0, 200)}"`)
    const result = JSON.parse(match[0]) as RoutingResult
    return Response.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
