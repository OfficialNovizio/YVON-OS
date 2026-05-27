import { callFast } from '@/lib/ai-client'
import type { RoutingResult } from '@/lib/types'

const CLASSIFIER_PROMPT = `You are a routing classifier for an AI team. Analyze the user's message and return JSON only — no explanation.

Available intents: strategy, marketing_content, social_tactics, content_create, growth_data, competitor_intel, technical_backend, technical_frontend, technical_general, qa_review, trending_content, operations, product_roadmap, advertising, github_analysis, finance

Available specialists: marcus-ceo, diana-coo, lena-brand, rio-ads, atlas-art-director, pixel-production, kai-analyst, nate-growth, dev-lead, raj-backend, mia-frontend, quinn-qa, felix-finance

Intent guidance — read carefully, priority order:
- github_analysis: ANY mention of GitHub repo, project structure, codebase analysis, commits, open issues, PRs, branch status, repo overview, "analyze the repo", "project structure", "hourbour repo", "novizio repo", "what's in the codebase", "analyze our code". Specialists: dev-lead + quinn-qa. THIS TAKES PRIORITY over strategy.
- technical_backend: API routes, database, Supabase, server-side logic, integrations, data models. Specialists: raj-backend + dev-lead.
- technical_frontend: UI components, styling, Tailwind, animations, design system, layout, responsiveness. Specialists: mia-frontend + dev-lead.
- technical_general: architecture decisions, full-stack features, or unclear which layer. Specialists: dev-lead + quinn-qa.
- qa_review: testing, bugs, code review, pre-ship checks, edge cases. Specialists: quinn-qa + dev-lead.
- strategy: high-level business direction, OKRs, priorities, executive decisions — only when no technical or GitHub keywords are present. Specialists: marcus-ceo + diana-coo.
- operations: workflow, process, project plan, milestones, sprint planning. Specialists: diana-coo + marcus-ceo.
- marketing_content: copy, captions, content writing, brand voice, email. Specialists: lena-brand + kai-analyst.
- advertising: paid ads, Meta, TikTok, ROAS, CPM, conversion. Specialists: rio-ads + marcus-ceo.
- growth_data: analytics, metrics, KPIs, funnel, growth experiments. Specialists: kai-analyst + nate-growth.
- competitor_intel: competitor research, market gap, rival brand analysis. Specialists: kai-analyst + rio-ads.
- finance: budget, P&L, revenue, CAC, LTV, MRR, margin, ROI, runway. Specialists: felix-finance + marcus-ceo.
- product_roadmap: feature planning, product decisions, roadmap prioritization. Specialists: diana-coo + dev-lead.

Return exactly: { "intent": "<intent>", "specialists": ["<id1>", "<id2>"], "reasoning": "<one sentence>" }
Pick 2 specialists maximum. Always return valid JSON. Never default to strategy when technical/GitHub keywords are present.`

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
