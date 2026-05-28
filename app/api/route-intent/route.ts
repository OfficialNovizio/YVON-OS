import { callFast } from '@/lib/ai-client'
import type { RoutingResult } from '@/lib/types'

const CLASSIFIER_PROMPT = `You are a routing classifier for an AI team. Analyze the user's message and return JSON only — no explanation.

Available intents: strategy, marketing_content, social_tactics, content_create, growth_data, competitor_intel, technical_backend, technical_frontend, technical_general, qa_review, trending_content, operations, product_roadmap, advertising, github_analysis, finance

Available specialists: marcus-ceo, diana-coo, lena-brand, rio-ads, atlas-art-director, pixel-production, kai-analyst, nate-growth, dev-lead, raj-backend, mia-frontend, quinn-qa, felix-finance

Intent guidance — read carefully, STRICT priority order (top = highest priority):

1. qa_review: error messages, stack traces, crash logs, exception/traceback output, "I'm getting an error", "error when I try to", "not working", "crashed", "broken", debug this, fix this bug. ANY pasted error output or stack trace → qa_review. Specialists: quinn-qa + dev-lead. THIS TAKES HIGHEST PRIORITY — a stack trace always beats everything else.

2. technical_backend: Firebase, Supabase, authentication (sign in, sign up, OAuth, auth errors), API routes, database, server logic, integrations, data models, backend errors, Flutter services, mobile auth, push notifications, cloud functions, storage. Specialists: raj-backend + dev-lead. Takes priority over github_analysis and strategy.

3. technical_frontend: UI components, styling, Tailwind, animations, design system, layout, responsiveness, Flutter widgets, screens, navigation, mobile UI. Specialists: mia-frontend + dev-lead.

4. technical_general: architecture decisions, full-stack features, Flutter app, mobile app, unclear which layer. Specialists: dev-lead + quinn-qa.

5. github_analysis: ONLY when explicitly asked for repo overview, project structure, codebase analysis, commits, PRs, branch status — and there is NO error or bug mentioned. Specialists: dev-lead + quinn-qa.

6. strategy: high-level business direction, OKRs, priorities, executive decisions — ONLY when absolutely no technical, error, or GitHub keywords are present. Specialists: marcus-ceo + diana-coo.

7. operations: workflow, process, project plan, milestones, sprint planning — NOT auth/login processes. Specialists: diana-coo + marcus-ceo.

8. marketing_content: copy, captions, content writing, brand voice, email. Specialists: lena-brand + kai-analyst.
9. advertising: paid ads, Meta, TikTok, ROAS, CPM, conversion. Specialists: rio-ads + marcus-ceo.
10. growth_data: analytics, metrics, KPIs, funnel, growth experiments. Specialists: kai-analyst + nate-growth.
11. competitor_intel: competitor research, market gap, rival brand analysis. Specialists: kai-analyst + rio-ads.
12. finance: budget, P&L, revenue, CAC, LTV, MRR, margin, ROI, runway. Specialists: felix-finance + marcus-ceo.
13. product_roadmap: feature planning, product decisions, roadmap prioritization. Specialists: diana-coo + dev-lead.

CRITICAL RULES:
- Any stack trace, error code, exception message → qa_review (not operations, not github_analysis)
- "sign in error", "login error", "auth error", "Firebase error", "flutter error" → technical_backend (not operations)
- "fix this", "please fix", "how do I fix" + any tech keyword → qa_review or technical_backend
- Never route auth/login ERRORS to operations — operations is for process/workflow planning only

Return exactly: { "intent": "<intent>", "specialists": ["<id1>", "<id2>"], "reasoning": "<one sentence>" }
Pick 2 specialists maximum. Always return valid JSON.`

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
