import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeRequestBody, AgentId } from '@/lib/types'
import { calcCostUsd } from '@/lib/token-cost'
import { getAgent } from '@/lib/agents'
import { getPersonalityExtension } from '@/lib/agent-personalities'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Fire-and-forget token usage save ─────────────────────────────────────────
async function saveUsage(params: {
  agentId: string | null
  route: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  costUsd: number
  ventureId: string | null
}): Promise<void> {
  // Only write to Supabase if configured — fail silently otherwise
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return

  try {
    await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        apikey:          supabaseKey,
        Authorization:   `Bearer ${supabaseKey}`,
        Prefer:          'return=minimal',
      },
      body: JSON.stringify({
        agent_id:              params.agentId,
        route:                 params.route,
        model:                 params.model,
        input_tokens:          params.inputTokens,
        output_tokens:         params.outputTokens,
        cache_read_tokens:     params.cacheReadTokens,
        cache_creation_tokens: params.cacheCreationTokens,
        cost_usd:              params.costUsd,
        venture_id:            params.ventureId,
      }),
    })
  } catch { /* non-fatal — never break streaming */ }
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: ClaudeRequestBody
  try {
    body = await request.json() as ClaudeRequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    systemPrompt,
    userMessage,
    model,
    agentId,
    ventureId,
    route: routeLabel,
    dataBlock,        // TOON-formatted context (Claude-optimized, 80%+ token savings)
  } = body

  // If agentId is provided, append the agent's personality baseline to the system prompt.
  let effectiveSystemPrompt = systemPrompt
  if (agentId) {
    const ext = getPersonalityExtension(agentId)
    if (ext) {
      effectiveSystemPrompt = (systemPrompt ?? '') + ext
    }
  }

  // Append TOON-formatted data block to system prompt (Claude-optimized contextual data)
  // This is where decision queues, venture context, session history are injected.
  // TOON format saves ~80% tokens vs JSON on Claude models.
  if (dataBlock) {
    effectiveSystemPrompt = (effectiveSystemPrompt ?? '') + '\n\n' + dataBlock
  }

  if (!userMessage) {
    return Response.json({ error: 'userMessage is required' }, { status: 400 })
  }

  const resolvedModel = model ?? 'claude-sonnet-4-6'
  // Note: webSearch flags removed — proxy cannot use Anthropic beta web search tool

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        const baseParams = {
          model: resolvedModel,
          max_tokens: 2048,
          system: effectiveSystemPrompt
            ? [{ type: 'text' as const, text: effectiveSystemPrompt, cache_control: { type: 'ephemeral' as const } }]
            : [],
          messages: [{ role: 'user' as const, content: userMessage }],
        }

        // Note: web search beta tools removed — local proxy cannot use Anthropic beta endpoints
        const anthropicStream = await client.messages.stream(baseParams)

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = JSON.stringify({ text: event.delta.text })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }

        // ── Capture usage from final message ──────────────────────────────────
        const finalMsg = await anthropicStream.finalMessage()
        const usage = finalMsg.usage as {
          input_tokens: number
          output_tokens: number
          cache_read_input_tokens?: number
          cache_creation_input_tokens?: number
        }

        const inputTokens          = usage.input_tokens ?? 0
        const outputTokens         = usage.output_tokens ?? 0
        const cacheReadTokens      = usage.cache_read_input_tokens ?? 0
        const cacheCreationTokens  = usage.cache_creation_input_tokens ?? 0
        const costUsd = calcCostUsd({
          model:              resolvedModel,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
        })

        // Emit usage to the client so the UI can show it inline
        const usageData = JSON.stringify({
          usage: {
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheCreationTokens,
            costUsd,
            model: resolvedModel,
          },
        })
        controller.enqueue(encoder.encode(`data: ${usageData}\n\n`))

        // Save to Supabase (non-blocking)
        void saveUsage({
          agentId:            agentId ?? null,
          route:              routeLabel ?? 'individual-chat',
          model:              resolvedModel,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
          costUsd,
          ventureId:          ventureId ?? null,
        })

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
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
