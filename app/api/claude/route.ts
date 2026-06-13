import Anthropic from '@anthropic-ai/sdk'
import type { ClaudeRequestBody, AgentId } from '@/lib/types'
import { calcCostUsd } from '@/lib/token-cost'
import { getAgent } from '@/lib/agents'
import { getPersonalityExtension } from '@/lib/agent-personalities'
import { buildCieContext } from 'toongine/cie'

import { autoToonMiddleware } from 'toongine/toon/auto/middleware'
import { decodeToonResponse } from 'toongine/toon/auto/decoder'
// DeepSeek via Anthropic endpoint — auto-configure base URL
const isDeepSeek = !!process.env.DEEPSEEK_API_KEY
const client = new Anthropic({
  apiKey: isDeepSeek ? process.env.DEEPSEEK_API_KEY : process.env.ANTHROPIC_API_KEY,
  baseURL: isDeepSeek
    ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic')
    : undefined,
})

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

  // ─── CIE INJECTION (Context Intelligence Engine v1) ─────────────────────────
  // Auto-injects relevant context from graphify, codegraph, agent memory,
  // Hermes memory, and project docs. Zero-token classification.
  // Adaptive: skips for short tasks, full context for complex tasks.
  let finalDataBlock = dataBlock ?? ''
  let userMessageFinal: string = userMessage as string
  if (agentId) {
    try {
      const cie = buildCieContext({
        agentId,
        task: String(userMessage).slice(0, 1000),
        venture: ventureId ?? 'yvon-dashboard',
      })
      if (cie.systemExtension) {
        effectiveSystemPrompt = (effectiveSystemPrompt ?? '') + '\n\n' + cie.systemExtension
      }
      if (cie.dataBlock) {
        finalDataBlock = (finalDataBlock ? finalDataBlock + '\n' : '') + cie.dataBlock
      }
      // ─── TOON BIDIRECTIONAL: compress output for data tasks ───────────────────
      // Data-processing tasks (filters, queries, extractions) benefit from
      // structured TOON-format responses — 60% fewer output tokens.
      // Reasoning tasks (strategy, marketing, design) keep prose output.
      const dataTaskTypes = ['backend_bug', 'data_query', 'ops_risk']
      const taskLen = String(userMessage).length
      if (taskLen > 300 && cie.itemsInjected > 2) {
        // Only enable TOON output for tasks where CIE actually injected context
        // (indicates structured data, not simple questions)
        userMessageFinal = String(userMessage) + 
          '\n\n[RESPOND IN TOON FORMAT: pipe-delimited fields. One record per line. No markdown, no intro, no conclusion. Example: id|action|reason_or_fix]'
      }
    } catch {
      // CIE is non-blocking — agent call proceeds without it on failure
    }
  }

  // Append TOON-formatted data block to system prompt
  if (finalDataBlock) {
    const toonInstruction = '\n\n[DATA FORMAT: The following data uses TOON (Token-Optimized Object Notation). Each line is a record. Fields are separated by | (pipe). The first character is the type prefix: D=decision, V=venture, S=session, T=task, C=competitor. Empty/missing values are marked as -. Parse each line by splitting on | and mapping fields positionally.]\n\n'
    effectiveSystemPrompt = (effectiveSystemPrompt ?? '') + toonInstruction + finalDataBlock
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
        // ─── TOON AUTO-COMPRESSION — dictionary + docs + memory + instructions ──
        const toonCtx = autoToonMiddleware({
          systemPrompt: effectiveSystemPrompt,
          userMessage: userMessageFinal,
          agentId,
          ventureId,
        })

        // Build enhanced system prompt with ALL TOON context injected
        const toonEnhancements = [
          // 1. Dictionary (comprehensive abbreviation map for LLM)
          toonCtx.dictionary ? `[TOON DICTIONARY — use these abbreviations:\n${toonCtx.dictionary}\n]` : '',
          // 2. Relevant documents (TOON-compressed, keyword-matched)
          toonCtx.relevantDocs ? `[RELEVANT DOCUMENTS (TOON-compressed):\n${toonCtx.relevantDocs}\n]` : '',
          // 3. Agent memory (TOON-compressed, most recent entries)
          toonCtx.relevantMemory ? `[AGENT MEMORY (TOON-compressed):\n${toonCtx.relevantMemory}\n]` : '',
          // 4. Output format instruction (for data-heavy tasks)
          toonCtx.outputInstruction || '',
        ].filter(Boolean).join('\n\n')

        const compressedSystem = effectiveSystemPrompt
          ? toonEnhancements + '\n\n' + effectiveSystemPrompt
          : effectiveSystemPrompt

        const compressedMessage = toonCtx.compressedUserMessage || userMessageFinal

        // Store TOON stats for the usage emission
        const toonStats = toonCtx.stats

        const baseParams = {
          model: resolvedModel,
          max_tokens: 2048,
          system: compressedSystem
            ? [{ type: 'text' as const, text: compressedSystem, cache_control: { type: 'ephemeral' as const } }]
            : [],
          messages: [{ role: 'user' as const, content: compressedMessage }],
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
          toon: toonStats,
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
