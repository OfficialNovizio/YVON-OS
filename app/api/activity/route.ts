import { getActivityFeed } from '@/lib/db'
import type { ActivityEvent } from '@/lib/types'

// GET — SSE stream of recent activity events (polling every 5s)
export async function GET(request: Request): Promise<Response> {
  const url       = new URL(request.url)
  const ventureId = url.searchParams.get('ventureId') ?? 'novizio'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(events: ActivityEvent[]) {
        const data = JSON.stringify(events)
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
      }

      // Send initial batch
      try {
        const events = await getActivityFeed(ventureId, 50)
        emit(events)
      } catch {
        controller.enqueue(encoder.encode(`data: []\n\n`))
      }

      // Poll every 5 seconds (up to ~60s to avoid serverless timeout)
      let iterations = 0
      const maxIterations = 11  // 60s max

      const interval = setInterval(async () => {
        iterations++
        if (iterations >= maxIterations) {
          clearInterval(interval)
          controller.close()
          return
        }

        // Check if client disconnected
        if (request.signal.aborted) {
          clearInterval(interval)
          controller.close()
          return
        }

        try {
          const events = await getActivityFeed(ventureId, 50)
          emit(events)
        } catch {
          // Ignore polling errors
        }
      }, 5000)

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
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
