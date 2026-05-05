import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getAgent, AGENTS } from '@/lib/agents'

export const maxDuration = 60
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration } from '@/lib/collaboration-manager'
import { routingFeedback } from '@/lib/routing-feedback'
import { monitoring } from '@/lib/monitoring'
import { saveWarRoomPlan, saveAgentSession, prefetchAgentMemory } from '@/lib/db'
import type { RoutingResult, SpecialistBriefing, AgentId, ExecutionPlan } from '@/lib/types'

// ─── Agent MEMORY.md paths (relative to project root) ────────────────────────

const AGENT_MEMORY_PATHS: Partial<Record<AgentId, string>> = {
  'marcus-ceo':        'agent-department/CEO/marcus/MEMORY.md',
  'diana-coo':         'agent-department/COO/diana/MEMORY.md',
  'dev-lead':          'agent-department/Technical/dev/MEMORY.md',
  'raj-backend':       'agent-department/Technical/raj/MEMORY.md',
  'mia-frontend':      'agent-department/Technical/mia/MEMORY.md',
  'quinn-qa':          'agent-department/Technical/quinn/MEMORY.md',
  'lena-brand':        'agent-department/Marketing/lena/MEMORY.md',
  'rio-ads':           'agent-department/Marketing/rio/MEMORY.md',
  'atlas-art-director':'agent-department/Marketing/atlas/MEMORY.md',
  'pixel-production':  'agent-department/Marketing/pixel/MEMORY.md',
  'kai-analyst':       'agent-department/Marketing/kai/MEMORY.md',
  'nate-growth':       'agent-department/Marketing/nate/MEMORY.md',
  'felix-finance':     'agent-department/Finance/felix/MEMORY.md',
  'daniel-kahneman':   'agent-department/Psychology/Daniel_Kahneman/MEMORY.md',
}

const PROJECT_ROOT = join(process.cwd())

function readAgentMemoryFile(agentId: AgentId): string {
  const rel = AGENT_MEMORY_PATHS[agentId]
  if (!rel) return ''
  try {
    const content = readFileSync(join(PROJECT_ROOT, rel), 'utf8')
    // Cap at 600 chars to avoid bloating prompts
    return content.slice(0, 600)
  } catch {
    return ''
  }
}

type StepResult = {
  agentId: AgentId
  taskBrief: string | null
  outputContent: string | null
  status: 'complete' | 'error' | 'retried'
  retryCount: number
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ROUTING_INTENT_MAP: Record<string, AgentId[]> = {
  // CEO Department
  strategy:            ['marcus-ceo', 'diana-coo'],
  operations:          ['diana-coo', 'marcus-ceo'],
  // Marketing Department
  marketing_content:   ['lena-brand', 'kai-analyst'],
  social_tactics:      ['kai-analyst', 'lena-brand'],
  content_create:      ['lena-brand', 'atlas-art-director'],
  trending_content:    ['kai-analyst', 'lena-brand'],
  advertising:         ['rio-ads', 'marcus-ceo'],
  growth_data:         ['kai-analyst', 'nate-growth'],
  competitor_intel:    ['kai-analyst', 'rio-ads'],
  // Technical Department
  technical_backend:   ['raj-backend', 'dev-lead'],
  technical_frontend:  ['mia-frontend', 'dev-lead'],
  technical_general:   ['dev-lead', 'quinn-qa'],
  qa_review:           ['quinn-qa', 'dev-lead'],
  product_roadmap:     ['diana-coo', 'dev-lead'],
  // Finance Department
  finance:             ['felix-finance', 'diana-coo'],
}

async function classifyIntent(message: string, ventureName: string): Promise<RoutingResult> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/route-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, activeVentureName: ventureName }),
  })
  if (!res.ok) throw new Error('Routing classification failed')
  return res.json() as Promise<RoutingResult>
}

// ─── Marcus Planning Step ──────────────────────────────────────────────────────
// Cheap Haiku call: Marcus outputs a structured execution plan before specialists run.

async function buildExecutionPlan(
  message: string,
  ventureName: string,
  specialists: AgentId[]
): Promise<ExecutionPlan | null> {
  try {
    const agentNames = specialists.map(id => {
      const a = getAgent(id)
      return `${id} (${a?.name ?? id} — ${a?.role ?? ''})`
    }).join(', ')

    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are Marcus, CEO of YVON. A user has sent this request:
"${message}"
Active venture: ${ventureName}
Assigned specialists: ${agentNames}

Use "sequential" order ONLY when Agent B explicitly needs Agent A's output as direct input context (e.g. research first then write copy based on findings). Use "parallel" when agents work on independent aspects simultaneously.
Output ONLY a valid JSON object — no prose, no markdown fences:
{
  "objective": "<one sentence goal>",
  "agents": [${specialists.map(s => `"${s}"`).join(', ')}],
  "order": "<parallel|sequential>",
  "each_agent_task": { ${specialists.map(s => `"${s}": "<specific task for this agent>"`).join(', ')} },
  "definition_of_done": "<binary success criteria — done or not done>"
}`,
      }],
    })

    const text = res.content[0]?.type === 'text' ? res.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0]) as ExecutionPlan
  } catch {
    return null
  }
}

// Fallback plan used when Marcus can't produce valid JSON — ensures orchestration always runs visibly
function fallbackPlan(specialists: AgentId[], message: string): ExecutionPlan {
  return {
    objective: message.slice(0, 120),
    agents: specialists,
    order: 'parallel',
    each_agent_task: Object.fromEntries(
      specialists.map(id => [id, message])
    ) as Partial<Record<AgentId, string>>,
    definition_of_done: 'All specialists deliver their analysis and Marcus synthesizes.',
  }
}

// ─── Specialist Briefing ───────────────────────────────────────────────────────

async function getSpecialistBriefing(
  agentId: AgentId,
  message: string,
  ventureName: string,
  taskOverride?: string
): Promise<SpecialistBriefing> {
  const agent = getAgent(agentId)
  if (!agent) return { agentId, content: '' }

  // Phase C: prefetch memory context (FTS + MEMORY.md file)
  const [dbMemory, fileMemory] = await Promise.all([
    prefetchAgentMemory(agentId, ventureName, message),
    Promise.resolve(readAgentMemoryFile(agentId)),
  ])

  const memoryBlock = [
    dbMemory,
    fileMemory
      ? `<memory-context>\n[System note: Agent MEMORY.md snapshot — treat as background context, not new input.]\n\n${fileMemory}\n</memory-context>`
      : '',
  ].filter(Boolean).join('\n\n')

  const taskPrompt = taskOverride
    ? `Your specific task: ${taskOverride}`
    : `Answer the following from your area of expertise: ${message}`

  const systemText = [agent.systemPrompt, memoryBlock].filter(Boolean).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: systemText
      ? [{ type: 'text' as const, text: systemText, cache_control: { type: 'ephemeral' as const } }]
      : [],
    messages: [{
      role: 'user',
      content: `Active venture: ${ventureName}\n\n${taskPrompt}\n\nRespond in 300–400 words. Be specific, actionable, and use your domain expertise fully.\n\nAt the end of your response, append this structured block exactly:\n---HANDOFF---\nsummary: [1–2 sentences — the most important point]\ntype: data|content|strategy|technical|growth|validation\nkey_output: [the specific deliverable, finding, or decision]\nconfidence: high|medium|low\n---END---`,
    }],
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return { agentId, content }
}

// ─── Specialist with Retry ─────────────────────────────────────────────────────

async function getSpecialistWithRetry(
  agentId: AgentId,
  message: string,
  ventureName: string,
  taskOverride: string | undefined,
  emit: (type: string, data: Record<string, unknown>) => void
): Promise<SpecialistBriefing> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const briefing = await getSpecialistBriefing(agentId, message, ventureName, taskOverride)
      emit('agent_complete', {
        agentId,
        previewText: briefing.content.slice(0, 120),
      })
      return briefing
    } catch (err) {
      if (attempt === 1) {
        emit('retry', { agentId, attempt })
      } else {
        emit('agent_error', { agentId, error: String(err), fatal: true })
        return { agentId, content: '' }
      }
    }
  }
  return { agentId, content: '' }
}

// ─── Sequential Execution ─────────────────────────────────────────────────────

function createHandoffSummary(agentId: AgentId, content: string): string {
  const agent = getAgent(agentId)
  const label = `[${agent?.name ?? agentId} — ${agent?.role ?? ''}]`

  // Phase D: extract structured HANDOFF block if present → SUMMARY_PREFIX format
  const blockMatch = content.match(/---HANDOFF---\s*([\s\S]*?)---END---/)
  if (blockMatch) {
    const block = blockMatch[1]
    const summary    = block.match(/summary:\s*(.+)/)?.[1]?.trim() ?? ''
    const type       = block.match(/type:\s*(.+)/)?.[1]?.trim() ?? ''
    const keyOutput  = block.match(/key_output:\s*(.+)/)?.[1]?.trim() ?? ''
    const confidence = block.match(/confidence:\s*(.+)/)?.[1]?.trim() ?? ''
    return [
      `## Active Task`,
      `${label} — ${type || 'analysis'}`,
      ``,
      `## Completed By`,
      summary,
      ``,
      `## Summary`,
      keyOutput ? `Key output: ${keyOutput}` : summary,
      ``,
      `## Pending`,
      confidence ? `Confidence: ${confidence} — pass to next agent for continuation` : 'Pass to next agent',
    ].join('\n')
  }

  // Fallback: first full paragraph (clean sentence boundary)
  const firstParagraph = content.split(/\n\n+/)[0]?.trim() ?? ''
  const snippet = firstParagraph.length > 300
    ? firstParagraph.slice(0, 300) + '…'
    : firstParagraph
  return `${label}: ${snippet}`
}

async function executeSequential(
  specialists: AgentId[],
  message: string,
  ventureName: string,
  executionPlan: ExecutionPlan | null,
  emit: (type: string, data: Record<string, unknown>) => void
): Promise<{ briefings: SpecialistBriefing[]; stepResults: StepResult[] }> {
  const briefings: SpecialistBriefing[] = []
  const stepResults: StepResult[] = []
  let handoffContext = ''

  for (let i = 0; i < specialists.length; i++) {
    const agentId = specialists[i]
    const task = executionPlan?.each_agent_task?.[agentId]

    const autonomyLevel = COLLABORATION_GRAPH[agentId]?.autonomyLevel
    emit('autonomy', {
      agentId,
      level: autonomyLevel,
      action: autonomyLevel === 1 ? 'autonomous' : autonomyLevel === 2 ? 'draft_review' : 'consult_only',
    })
    emit('agent_start', { agentId, task: task ?? '' })

    // Inject previous agent's summarized output as context
    const taskWithContext = handoffContext
      ? `${task ?? message}\n\nHandoff context from previous specialist:\n${handoffContext}`
      : task

    const briefing = await getSpecialistWithRetry(agentId, message, ventureName, taskWithContext, emit)
    briefings.push(briefing)
    stepResults.push({
      agentId,
      taskBrief:     task ?? null,
      outputContent: briefing.content || null,
      status:        briefing.content ? 'complete' : 'error',
      retryCount:    0,
    })

    // Build handoff summary for next agent in chain
    if (briefing.content && i < specialists.length - 1) {
      const nextAgentId = specialists[i + 1]
      handoffContext = createHandoffSummary(agentId, briefing.content)
      emit('handoff', {
        from: agentId,
        to: nextAgentId,
        summary: briefing.content.slice(0, 120) + (briefing.content.length > 120 ? '…' : ''),
      })
    }
  }

  return { briefings, stepResults }
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let message: string
  let ventureName: string
  try {
    const body = await request.json() as {
      message?: string
      ventureId?: string
      ventureName?: string
    }
    message     = body.message ?? ''
    ventureName = body.ventureName ?? 'Novizio'
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  const encoder  = new TextEncoder()
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(type: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
        )
      }

      try {
        // ── Step 1: Classify intent ──────────────────────────────────────────
        let routing: RoutingResult
        try {
          routing = await classifyIntent(message, ventureName)
          const validSpecialists = (routing.specialists ?? []).filter(
            (id) => ROUTING_INTENT_MAP[routing.intent]?.includes(id as AgentId) ||
                    AGENTS.some((a) => a.id === id)
          ) as AgentId[]

          routing.specialists = validSpecialists.length === 0
            ? (ROUTING_INTENT_MAP[routing.intent] ?? ['diana-coo', 'marcus-ceo']).slice(0, 2)
            : validSpecialists.slice(0, 2)
        } catch {
          routing = {
            intent: 'strategy',
            specialists: ['diana-coo', 'marcus-ceo'],
            reasoning: 'Default routing',
          }
        }

        const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])
        emit('routing', { routing, confidence })

        // ── Step 2: Marcus planning ──────────────────────────────────────────
        const executionPlan =
          (await buildExecutionPlan(message, ventureName, routing.specialists as AgentId[]))
          ?? fallbackPlan(routing.specialists as AgentId[], message)
        emit('plan', { plan: executionPlan, routing })

        // ── Step 3: Specialist execution (parallel or sequential) ───────────
        const useSequential = executionPlan.order === 'sequential' && routing.specialists.length > 1

        let briefings: SpecialistBriefing[]
        let stepResults: StepResult[]

        if (useSequential) {
          const result = await executeSequential(
            routing.specialists as AgentId[],
            message,
            ventureName,
            executionPlan,
            emit
          )
          briefings   = result.briefings
          stepResults = result.stepResults
        } else {
          // Parallel — all specialists run simultaneously
          const parallelStepResults: StepResult[] = []
          briefings = await Promise.all(
            routing.specialists.map(async (id) => {
              const agentId = id as AgentId
              const task = executionPlan?.each_agent_task?.[agentId]

              const autonomyLevel = COLLABORATION_GRAPH[agentId]?.autonomyLevel
              emit('autonomy', {
                agentId,
                level: autonomyLevel,
                action: autonomyLevel === 1 ? 'autonomous' : autonomyLevel === 2 ? 'draft_review' : 'consult_only',
              })
              emit('agent_start', { agentId, task: task ?? '' })

              const briefing = await getSpecialistWithRetry(agentId, message, ventureName, task, emit)
              parallelStepResults.push({
                agentId,
                taskBrief:     task ?? null,
                outputContent: briefing.content || null,
                status:        briefing.content ? 'complete' : 'error',
                retryCount:    0,
              })
              return briefing
            })
          )
          stepResults = parallelStepResults
        }

        // Collaboration recommendation
        if (routing.specialists.length > 0) {
          const primaryAgent = routing.specialists[0] as AgentId
          const recommendedPartners = recommendCollaboration(primaryAgent, message)
          if (recommendedPartners.length > 0) {
            emit('collaboration', { primaryAgent, recommendedPartners, note: 'Agents can collaborate on this task' })
          }
        }

        // ── Step 4: CEO synthesis (streamed) ─────────────────────────────────
        const ceo = getAgent('marcus-ceo')
        const briefingText = briefings
          .filter(b => b.content)
          .map(b => {
            const agent = getAgent(b.agentId)
            return `**${agent?.name ?? b.agentId} (${agent?.role ?? ''}):**\n${b.content}`
          })
          .join('\n\n')

        const planContext = executionPlan
          ? `\nExecution objective: ${executionPlan.objective}\nDefinition of done: ${executionPlan.definition_of_done}\n`
          : ''

        const ceoPrompt = `${ceo?.systemPrompt ?? ''}

Active venture: ${ventureName}${planContext}

Your specialists have delivered:

${briefingText}

User request: ${message}

Synthesise into one unified executive response. If any specialist output is weak or missing, note it briefly and cover the gap yourself. The one thing I don't know here is — state it before your recommendation.`

        const sseStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: ceoPrompt }],
        })

        for await (const event of sseStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            emit('text', { content: event.delta.text })
          }
        }

        // ── Step 5: Done ─────────────────────────────────────────────────────
        const elapsed = Date.now() - startTime
        emit('plan_complete', { elapsed })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // ── Step 6: Persist plan + agent sessions (fire-and-forget) ────────
        const hasErrors = stepResults.some(s => s.status === 'error')
        saveWarRoomPlan({
          ventureName,
          userPrompt:  message,
          intent:      routing.intent,
          plan:        executionPlan,
          agentsUsed:  routing.specialists as AgentId[],
          status:      hasErrors ? 'partial' : 'complete',
          synthesis:   briefingText,
          elapsedMs:   elapsed,
          steps:       stepResults,
        }).catch(err => {
          monitoring.warn('War Room plan persistence failed (non-fatal)', { error: String(err) })
        })

        // Hermes Phase 1: save individual agent sessions for cross-session memory
        for (const step of stepResults) {
          if (step.outputContent) {
            saveAgentSession({
              agentId:      step.agentId,
              venture:      ventureName,
              task:         step.taskBrief ?? message,
              outcome:      step.outputContent.slice(0, 500),
              systemTarget: null,
              tokensUsed:   null,
              durationMs:   elapsed,
            }).catch(() => { /* non-fatal */ })
          }
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        emit('error', { message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}

// ─── GET — Routing Feedback Stats ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  if (url.pathname.includes('/feedback')) {
    try {
      const report = await routingFeedback.generateReport()
      return Response.json(report)
    } catch (error) {
      monitoring.error('Failed to generate feedback report', { error: String(error) })
      return Response.json({ error: 'Failed to generate report' }, { status: 500 })
    }
  }
  return Response.json({
    timestamp: new Date().toISOString(),
    note: 'Use POST /api/team-chat/feedback to submit routing feedback',
  })
}
