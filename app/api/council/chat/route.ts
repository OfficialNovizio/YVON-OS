/**
 * POST /api/council/chat — Streaming Agent Chat with Persistent Sessions
 *
 * Each venture gets ONE active chat session with Marcus (CEO).
 * Context fingerprinted — rebuilt only when source files change.
 * Specialist agents delegated via "@agent-id" mentions.
 *
 * SSE stream events:
 *   event: meta     → { contextTokens, deltaDetected }
 *   event: chunk    → { text }  (streamed agent output)
 *   event: done     → { totalTokens, deltaDetected }
 *   event: error    → { error }
 */

import { NextRequest } from 'next/server'
import {
  getOrCreateSession,
  sendChatMessage,
  closeVentureSession,
  getVentureSession,
} from '@/lib/chat-session'

const VALID_VENTURES = ['novizio', 'hourbour', 'yvon']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { venture, message, action } = body as {
      venture: string
      message?: string
      action?: 'send' | 'create' | 'close' | 'status'
    }

    if (!venture || !VALID_VENTURES.includes(venture)) {
      return jsonResponse(400, { error: `Invalid venture. Valid: ${VALID_VENTURES.join(', ')}` })
    }

    // ── CREATE ────────────────────────────────────────────────────────
    if (action === 'create') {
      const session = getOrCreateSession(venture)
      return jsonResponse(200, {
        venture,
        created: true,
        messageCount: session.messages.length,
        contextTokens: session.context?.totalTokens || 0,
        uptime: Date.now() - session.createdAt,
      })
    }

    // ── STATUS ────────────────────────────────────────────────────────
    if (action === 'status') {
      const session = getVentureSession(venture)
      return jsonResponse(200, {
        active: !!session,
        venture,
        messageCount: session?.messages.length || 0,
        totalTokens: session?.totalTokens || 0,
        lastActivity: session?.lastActivity || null,
      })
    }

    // ── CLOSE ─────────────────────────────────────────────────────────
    if (action === 'close') {
      const closed = closeVentureSession(venture)
      return jsonResponse(200, { closed, venture })
    }

    // ── SEND (SSE stream) ─────────────────────────────────────────────
    if (!message || !message.trim()) {
      return jsonResponse(400, { error: 'message required' })
    }

    const encoder = new TextEncoder()
    let deltaDetected = false
    let totalTokens = 0

    const stream = new ReadableStream({
      async start(controller) {
        const sendSSE = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        try {
          // Send initial heartbeat
          sendSSE('meta', { status: 'thinking', venture })

          const result = await sendChatMessage(venture, message.trim())

          deltaDetected = result.deltaDetected
          totalTokens = result.tokens

          // Stream in 200-character chunks
          for (let i = 0; i < result.content.length; i += 200) {
            sendSSE('chunk', { text: result.content.slice(i, i + 200) })
          }

          sendSSE('done', {
            totalTokens: result.tokens,
            deltaDetected: result.deltaDetected,
          })
        } catch (err: any) {
          sendSSE('error', { error: err.message || 'Agent error' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Venture': venture,
      },
    })
  } catch (err: any) {
    return jsonResponse(500, { error: err.message })
  }
}

// GET — returns session status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const venture = searchParams.get('venture')
  if (!venture) {
    return jsonResponse(400, { error: 'venture param required' })
  }
  const session = getVentureSession(venture)
  return jsonResponse(200, {
    active: !!session,
    venture,
    messageCount: session?.messages.length || 0,
    totalTokens: session?.totalTokens || 0,
    lastActivity: session?.lastActivity || null,
  })
}

function jsonResponse(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
