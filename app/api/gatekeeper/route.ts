/**
 * POST /api/gatekeeper
 *
 * Pre-flight validation route. Classifies user intent and routes to the correct
 * agent BEFORE any LLM call. Uses lightweight keyword-based classification for fast,
 * token-efficient routing.
 *
 * Body: { message: string, venture?: string }
 *
 * Response: GatekeeperResult
 *   - targetAgent: which agent should handle this
 *   - department: which department
 *   - confidence: 0.0-1.0
 *   - reasoning: why this routing decision was made
 *   - missingContext: what context is needed but missing
 *   - suggestedReformulation: how to improve the query if context is missing
 */

import { gatekeep, containsInjection } from '@/lib/gatekeeper'
import { monitoring } from '@/lib/monitoring'
import type { GatekeeperResult } from '@/lib/gatekeeper'

export async function POST(request: Request): Promise<Response> {
  let message: string
  let venture: string | undefined

  try {
    const body = await request.json() as {
      message?: string
      venture?: string
    }
    message = body.message ?? ''
    venture = body.venture
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  // Phase H: injection guard — block before any LLM call
  if (containsInjection(message)) {
    monitoring.warn('Gatekeeper blocked injection attempt', { message: message.slice(0, 100) })
    return Response.json({ error: 'Message blocked by safety filter' }, { status: 422 })
  }

  try {
    const result = gatekeep(message, venture)

    monitoring.info('Gatekeeper routing decision', {
      targetAgent: result.targetAgent,
      department: result.department,
      confidence: result.confidence,
      intent: result.reasoning
    })

    return Response.json(result as GatekeeperResult)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    monitoring.error('Gatekeeper classification failed', { error: msg })
    return Response.json({ error: msg }, { status: 500 })
  }
}