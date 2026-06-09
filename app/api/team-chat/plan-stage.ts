/**
 * app/api/team-chat/plan-stage.ts — Stage 1: Marcus Planning.
 *
 * Classifies intent, builds the execution plan, and emits the approval gate card.
 * This is a PURE planning function — it NEVER executes specialists.
 *
 * Structural gate (Fix #6): Phase 1 and Phase 2 are separate functions.
 * You cannot delete the gate without deleting this entire function.
 */

import { callSynthesis, classifyIntentSemantic } from '@/lib/ai-client'
import { AGENTS } from '@/lib/agents'
import { VENTURE_TECH_STACK } from '@/lib/ventures'
import type { RoutingResult, RoutingIntent, AgentId, ExecutionPlan } from '@/lib/types'

// ─── Specialist routing map ──────────────────────────────────────────────────

interface SemanticKey { command: string; domain: string; layer: string }

function mapSemanticToRouting(key: SemanticKey): { intent: RoutingIntent; specialists: AgentId[] } {
  const { command, domain, layer } = key

  if (domain === 'technical') {
    if (command === 'fix' || command === 'improve') {
      if (layer === 'frontend') return { intent: 'technical_frontend', specialists: ['mia-frontend', 'dev-lead'] }
      if (layer === 'backend') return { intent: 'technical_backend', specialists: ['raj-backend', 'dev-lead'] }
      return { intent: 'qa_review', specialists: ['quinn-qa', 'dev-lead'] }
    }
    if (command === 'analyze') {
      if (layer === 'frontend') return { intent: 'technical_frontend', specialists: ['mia-frontend', 'dev-lead'] }
      if (layer === 'backend') return { intent: 'technical_backend', specialists: ['raj-backend', 'dev-lead'] }
      return { intent: 'technical_general', specialists: ['dev-lead', 'quinn-qa'] }
    }
    if (command === 'report') return { intent: 'github_analysis', specialists: ['dev-lead', 'quinn-qa'] }
    return { intent: 'technical_general', specialists: ['dev-lead', 'quinn-qa'] }
  }

  if (domain === 'marketing') {
    if (command === 'fix' || command === 'improve') {
      if (layer === 'content') return { intent: 'marketing_content', specialists: ['lena-brand', 'kai-analyst'] }
      if (layer === 'visual') return { intent: 'content_create', specialists: ['atlas-art-director', 'lena-brand'] }
      return { intent: 'advertising', specialists: ['rio-ads', 'nate-growth'] }
    }
    if (command === 'analyze') {
      if (layer === 'data') return { intent: 'growth_data', specialists: ['kai-analyst', 'nate-growth'] }
      return { intent: 'competitor_intel', specialists: ['kai-analyst', 'rio-ads'] }
    }
    if (command === 'report') return { intent: 'competitor_intel', specialists: ['kai-analyst', 'lena-brand'] }
    if (command === 'suggest') return { intent: 'marketing_content', specialists: ['lena-brand', 'kai-analyst'] }
    return { intent: 'social_tactics', specialists: ['kai-analyst', 'lena-brand'] }
  }

  if (domain === 'finance') return { intent: 'finance', specialists: ['felix-finance', 'marcus-ceo'] }

  if (domain === 'strategy') {
    if (command === 'suggest') return { intent: 'strategy', specialists: ['marcus-ceo', 'felix-finance'] }
    return { intent: 'strategy', specialists: ['marcus-ceo', 'diana-coo'] }
  }

  if (domain === 'mixed') return { intent: 'strategy', specialists: ['marcus-ceo', 'dev-lead'] }

  return { intent: 'strategy', specialists: ['marcus-ceo', 'diana-coo'] }
}

// ─── Marcus orchestration ────────────────────────────────────────────────────

/**
 * Marcus analyzes the user's message, picks the right specialists, and writes
 * each one a specific task brief. One LLM call — replaces the old two-call
 * (classifyIntent + buildExecutionPlan) approach.
 */
async function marcusOrchestrate(
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  conversationHistory?: Array<{ user: string; marcus: string }>,
): Promise<{ routing: RoutingResult; plan: ExecutionPlan } | null> {
  try {
    const techStack     = VENTURE_TECH_STACK[ventureSlug ?? ''] ?? 'web/mobile app'
    const isFlutter     = techStack.includes('Flutter')
    const dbTech        = techStack.includes('Firebase') ? 'Firebase' : 'Supabase'
    const frameworkTech = isFlutter ? 'Flutter/Dart' : 'Next.js/TypeScript'
    const frontendScope = isFlutter
      ? 'Flutter screens, widgets, navigation, mobile UX, Dart UI code'
      : 'React/Next.js UI components, Tailwind CSS, layout, UX'

    const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()

    const historyBlock = conversationHistory && conversationHistory.length > 0
      ? `\n\nPrior conversation (${conversationHistory.length} turns):\n` +
        conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus}`).join('\n\n')
      : ''

    const prompt =
`You are Marcus, CEO of YVON. Venture: ${ventureName} — ${techStack}${historyBlock}

User request: "${cleanMsg}"

YOUR JOB: Pick the right specialists and write each one a detailed, specific brief (150-200 words each) that tells them exactly what to investigate, what questions to answer, and what output to produce.

TEAM:
dev-lead          — ${frameworkTech} architecture, full-stack decisions, code review
raj-backend       — ${dbTech} APIs, database schema, server logic, auth flows
mia-frontend      — ${frontendScope}
quinn-qa          — Debugging, error diagnosis, code quality, testing
lena-brand        — Brand voice, copywriting, captions, email copy
rio-ads           — Paid ads, Meta/TikTok, ROAS, CPM, ad creative
atlas-art-director— Visual identity, art direction, creative briefs
kai-analyst       — Analytics, metrics, competitive intelligence, growth data
nate-growth       — Growth experiments, funnel strategy, acquisition
felix-finance     — P&L, CAC, LTV, MRR, runway, financial modeling
daniel-kahneman   — Cognitive bias audit, behavioral economics
diana-coo         — Operations, project plans, sprint milestones

HARD RULES:
1. Stack trace / exception in request → specialists: ["quinn-qa","dev-lead"]
2. ${dbTech} auth error / login broken → specialists: ["raj-backend","dev-lead"]
3. UI / screen / component / layout / design / styling / UX analysis or implementation → specialists: ["mia-frontend","dev-lead"]
4. Use 2 specialists for single-domain tasks. Use 3-4 only when the task genuinely spans multiple domains.

ORDER RULE:
- sequential: when specialists depend on each other (e.g. backend writes → frontend integrates, or dev fixes → QA verifies). Each agent sees the previous agent's full output.
- parallel: when specialists work independently (reports, strategy, marketing, analysis).
Default to sequential for technical tasks involving code changes. Default to parallel for analysis and strategy.

INTENT OPTIONS (pick one):
strategy | operations | technical_frontend | technical_backend | technical_general | qa_review | marketing_content | social_tactics | advertising | growth_data | competitor_intel | trending_content | finance | behavioral_audit | github_analysis | product_roadmap

Return ONLY valid JSON — no markdown, no explanation:
{"intent":"<intent>","specialists":["<id1>","<id2>"],"reasoning":"<one sentence>","objective":"<clear goal>","order":"sequential|parallel","each_agent_task":{"<id1>":"<detailed 150-200 word brief for id1 — specific files, questions, expected output>","<id2>":"<detailed 150-200 word brief for id2>"},"definition_of_done":"<binary success criteria>"}`

    const text = await Promise.race([
      callSynthesis({ maxTokens: 4096, messages: [{ role: 'user', content: prompt }] }),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('orchestration_timeout')), 45000)),
    ])

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    const r = JSON.parse(match[0]) as {
      intent?:             string
      specialists?:        string[]
      reasoning?:          string
      objective?:          string
      order?:              string
      each_agent_task?:    Record<string, string>
      definition_of_done?: string
    }

    const validSpecialists = (r.specialists ?? [])
      .filter((id): id is AgentId => AGENTS.some(a => a.id === id))

    if (validSpecialists.length === 0) return null

    return {
      routing: {
        intent:      (r.intent ?? 'strategy') as RoutingIntent,
        specialists: validSpecialists,
        reasoning:   r.reasoning ?? '',
      },
      plan: {
        objective:          r.objective ?? cleanMsg.slice(0, 120),
        agents:             validSpecialists,
        order:              (r.order === 'sequential' ? 'sequential' : 'parallel'),
        each_agent_task:    Object.fromEntries(
          validSpecialists.map(id => [id, r.each_agent_task?.[id] ?? cleanMsg])
        ) as Partial<Record<AgentId, string>>,
        definition_of_done: r.definition_of_done ?? 'All specialists deliver their analysis and Marcus synthesizes.',
      },
    }
  } catch {
    return null
  }
}

// ─── Fallback plan ───────────────────────────────────────────────────────────

const FALLBACK_TASK_TEMPLATES: Partial<Record<AgentId, (msg: string) => string>> = {
  'dev-lead':           msg => `Review the codebase architecture, structure, and technical health. User request: ${msg}`,
  'quinn-qa':           msg => `Audit code quality, test coverage, open issues, and flag any risks. User request: ${msg}`,
  'raj-backend':        msg => `Examine backend architecture, API routes, database schema, and server-side logic. User request: ${msg}`,
  'mia-frontend':       msg => `Review UI components, design system, and frontend structure. User request: ${msg}`,
  'marcus-ceo':         msg => `Provide executive synthesis and strategic recommendations. User request: ${msg}`,
  'diana-coo':          msg => `Assess operational processes, workflows, and execution readiness. User request: ${msg}`,
  'kai-analyst':        msg => `Analyze metrics, data signals, and surface key insights. User request: ${msg}`,
  'lena-brand':         msg => `Review brand voice, content strategy, and messaging quality. User request: ${msg}`,
  'rio-ads':            msg => `Analyze paid channel performance, ROAS, and ad strategy. User request: ${msg}`,
  'nate-growth':        msg => `Identify growth opportunities and top-of-funnel optimizations. User request: ${msg}`,
  'felix-finance':      msg => `Analyze financial metrics, P&L, and budget implications. User request: ${msg}`,
  'atlas-art-director': msg => `Review visual identity, creative direction, and brand assets. User request: ${msg}`,
  'pixel-production':   msg => `Coordinate asset production pipeline and delivery. User request: ${msg}`,
  'daniel-kahneman':    msg => `Apply behavioral psychology and cognitive bias analysis to the decision. User request: ${msg}`,
}

function fallbackPlan(specialists: AgentId[], message: string): ExecutionPlan {
  return {
    objective: message.slice(0, 120),
    agents: specialists,
    order: 'parallel',
    each_agent_task: Object.fromEntries(
      specialists.map(id => [id, (FALLBACK_TASK_TEMPLATES[id] ?? ((m: string) => m.slice(0, 120)))(message)])
    ) as Partial<Record<AgentId, string>>,
    definition_of_done: 'All specialists deliver their analysis and Marcus synthesizes.',
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface PlanStageParams {
  message: string
  ventureName: string
  ventureSlug?: string
  conversationHistory?: Array<{ user: string; marcus: string }>
}

export interface PlanStageResult {
  routing: RoutingResult
  plan: ExecutionPlan
}

/**
 * Stage 1 — Plan.
 *
 * Runs Marcus's orchestration: classifies intent, picks specialists, writes
 * task briefs. Falls back to classifier + generic plan if orchestration fails.
 *
 * This function NEVER executes specialists. The caller must use the returned
 * { routing, plan } to emit the approval gate, then call execute-stage.ts
 * separately when the user approves.
 */
export async function runPlanStage(params: PlanStageParams): Promise<PlanStageResult> {
  const { message, ventureName, ventureSlug, conversationHistory } = params

  // First: try Marcus orchestration (one LLM call for classification + planning)
  const orchestration = await marcusOrchestrate(message, ventureName, ventureSlug, conversationHistory)
  if (orchestration) return orchestration

  // Fallback: semantic classifier + generic plan
  try {
    const semantic = await classifyIntentSemantic(message, ventureName, ventureSlug)
    const { intent, specialists } = mapSemanticToRouting({
      command: semantic.command,
      domain: semantic.domain,
      layer: semantic.layer,
    })
    return {
      routing: {
        intent,
        specialists,
        reasoning: `[${semantic.command}/${semantic.domain}/${semantic.layer}] ${semantic.reasoning}`,
      },
      plan: fallbackPlan(specialists, message),
    }
  } catch {
    // Last resort: direct-to-Marcus
    return {
      routing: {
        intent: 'strategy',
        specialists: ['marcus-ceo'],
        reasoning: 'Fallback routing — orchestration and classifier both unavailable',
      },
      plan: fallbackPlan(['marcus-ceo'], message),
    }
  }
}
