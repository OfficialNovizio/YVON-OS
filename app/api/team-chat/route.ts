import Anthropic from '@anthropic-ai/sdk'
import { getAgent, AGENTS } from '@/lib/agents'
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration, handoffManager, canActAutonomously } from '@/lib/collaboration-manager'
import { routingFeedback } from '@/lib/routing-feedback'
import { monitoring } from '@/lib/monitoring'
import type { RoutingResult, SpecialistBriefing, AgentId } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ROUTING_INTENT_MAP: Record<string, AgentId[]> = {
  // Executive
  strategy:            ['marcus-ceo', 'diana-coo'],
  operations:          ['diana-coo', 'kai-analyst'],
  // Marketing (Marcus absorbed Alex's director function)
  marketing_content:   ['marcus-ceo', 'lena-brand'],
  social_tactics:      ['sofia-social', 'kai-analyst'],
  content_create:      ['lena-brand', 'sofia-social'],
  trending_content:    ['sofia-social', 'lena-brand'],
  advertising:         ['rio-ads', 'marcus-ceo'],
  // Creative Studio (Atlas absorbed Opus's ops coordination)
  creative_studio:     ['atlas-art-director', 'pixel-production'],
  visual_direction:    ['atlas-art-director', 'pixel-production'],
  creative_ops:        ['atlas-art-director', 'sofia-social'],
  // Analytics
  growth_data:         ['nate-growth', 'kai-analyst'],
  competitor_intel:    ['zara-competitor', 'nate-growth'],
  venture_validation:  ['venture-scout', 'felix-finance'],
  // Technical (Diana absorbed Priya's PM function; Mia absorbed Leo's UX function)
  technical_backend:   ['raj-backend', 'dev-lead'],
  technical_frontend:  ['mia-frontend', 'dev-lead'],
  technical_general:   ['dev-lead', 'quinn-qa'],
  qa_review:           ['quinn-qa', 'dev-lead'],
  product_roadmap:     ['diana-coo', 'dev-lead'],
  // Personal
  personal_brand:      ['stark-growth', 'lena-brand'],
  linkedin:            ['stark-growth', 'sofia-social'],
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

async function getSpecialistBriefing(
  agentId: AgentId,
  message: string,
  ventureName: string
): Promise<SpecialistBriefing> {
  const agent = getAgent(agentId)
  if (!agent) return { agentId, content: '' }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    system: agent.systemPrompt
      ? [{ type: 'text' as const, text: agent.systemPrompt, cache_control: { type: 'ephemeral' as const } }]
      : [],
    messages: [
      {
        role: 'user',
        content: `Active venture: ${ventureName}\n\nBriefly answer the following in 100-150 words from your area of expertise:\n\n${message}`,
      },
    ],
  })

  const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
  return { agentId, content }
}

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

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(type: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
        )
      }

      try {
        // Step 1: Classify intent
        let routing: RoutingResult
        try {
          routing = await classifyIntent(message, ventureName)
          // Ensure specialists are valid AgentIds, then hard-cap at 2
          const validSpecialists = (routing.specialists ?? []).filter(
            (id) => ROUTING_INTENT_MAP[routing.intent]?.includes(id as AgentId) ||
                    AGENTS.some((a) => a.id === id)
          ) as AgentId[]

          if (validSpecialists.length === 0) {
            routing.specialists = (ROUTING_INTENT_MAP[routing.intent] ?? ['diana-coo', 'marcus-ceo']).slice(0, 2)
          } else {
            routing.specialists = validSpecialists.slice(0, 2)
          }
        } catch {
          routing = {
            intent: 'strategy',
            specialists: ['diana-coo', 'marcus-ceo'],
            reasoning: 'Default routing',
          }
        }

        // Add routing confidence to emit
        const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])
        emit('routing', { routing, confidence })

        // Step 2: Parallel specialist briefings with autonomy check
        const briefings = await Promise.all(
          routing.specialists.map(async (id) => {
            const agentId = id as AgentId

            // Check autonomy level
            const autonomyLevel = COLLABORATION_GRAPH[agentId]?.autonomyLevel
            if (autonomyLevel === 1) {
              // Fully autonomous - can act without review
              emit('autonomy', { agentId, level: autonomyLevel, action: 'autonomous' })
            } else if (autonomyLevel === 2) {
              // Draft + review
              emit('autonomy', { agentId, level: autonomyLevel, action: 'draft_review' })
            } else {
              // Consult only
              emit('autonomy', { agentId, level: autonomyLevel, action: 'consult_only' })
            }

            return getSpecialistBriefing(agentId, message, ventureName)
          })
        )

        // Recommend collaboration between specialists
        if (routing.specialists.length > 0) {
          const primaryAgent = routing.specialists[0] as AgentId
          const recommendedPartners = recommendCollaboration(primaryAgent, message)
          if (recommendedPartners.length > 0) {
            emit('collaboration', {
              primaryAgent,
              recommendedPartners,
              note: 'Agents can collaborate on this task'
            })
          }
        }
        // Step 3: CEO synthesis (streamed)
        const ceo = getAgent('marcus-ceo')
        const briefingText = briefings
          .map((b) => {
            const agent = getAgent(b.agentId)
            return `**${agent?.name ?? b.agentId} (${agent?.role ?? ''}):**\n${b.content}`
          })
          .join('\n\n')

        const ceoPrompt = `${ceo?.systemPrompt ?? ''}\n\nActive venture: ${ventureName}\n\nYour team has provided the following specialist briefings:\n\n${briefingText}\n\nUser question: ${message}\n\nSynthesize these briefings into a unified executive response.`

        const sseStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: ceoPrompt }],
        })

        for await (const event of sseStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            emit('text', { content: event.delta.text })
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
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

// NOTE: /api/team-chat/feedback should be its own route file, not a duplicate POST here

/**
 * GET /api/team-chat/feedback
 * Get routing feedback stats
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)

  // Check if this is a feedback request
  if (url.pathname.includes('/feedback')) {
    try {
      const report = await routingFeedback.generateReport()

      return Response.json(report)
    } catch (error) {
      monitoring.error('Failed to generate feedback report', { error: String(error) })
      return Response.json({ error: 'Failed to generate report' }, { status: 500 })
    }
  }

  // Default: return routing stats
  return Response.json({
    timestamp: new Date().toISOString(),
    note: 'Use POST /api/team-chat/feedback to submit routing feedback'
  })
}
