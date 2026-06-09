/**
 * orchestrator/server.ts — YVON Agent Engine: standalone orchestrator (A2).
 *
 * A persistent Node service that runs War Room sessions OUTSIDE Vercel's
 * serverless limits, so many sessions can run in parallel for as long as they
 * need. Runs identically:
 *   - locally:   npm run engine:dev        (tsx)
 *   - in Docker: docker compose up         (Mac + Windows + container host)
 *
 * This A2 step establishes the runtime: HTTP + SSE + per-session isolation
 * (reusing the pure lib/session.ts). The full LLM pipeline is migrated into
 * `runSession` in later foundation steps; the Next.js path keeps working
 * unchanged until then.
 *
 * Endpoints:
 *   GET /health        → liveness + uptime + active session count
 *   GET /run?tag=...   → SSE; opens an isolated session, streams events, closes
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import {
  createSession, runInSession, currentSession,
  sessionCacheSetFile, sessionCacheGetFile,
} from '../lib/session'

const PORT = Number(process.env.ORCHESTRATOR_PORT ?? 8787)
const startedAt = Date.now()
let activeSessions = 0

function sse(res: ServerResponse, event: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify(event)}\n\n`)
}

/**
 * Run one isolated session. In A2 this proves the runtime + isolation; later
 * foundation steps replace the body with the real plan→execute→verify pipeline.
 */
async function runSession(tag: string, res: ServerResponse): Promise<void> {
  activeSessions++
  const session = createSession({ repoMode: 'local', localRepoPath: `/sessions/${tag}` })
  try {
    await runInSession(session, async () => {
      sse(res, { type: 'session_started', id: currentSession()?.id, tag })
      // Demonstrate per-session cache isolation in the standalone runtime.
      sessionCacheSetFile('/demo.dart', `content-for-${tag}`)
      await new Promise(r => setTimeout(r, 30))
      sse(res, { type: 'cache_check', tag, value: sessionCacheGetFile('/demo.dart') })
      sse(res, { type: 'done', tag, stats: currentSession()?.stats })
    })
  } finally {
    activeSessions--
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, service: 'yvon-orchestrator', uptimeMs: Date.now() - startedAt, activeSessions }))
    return
  }

  if (url.pathname === '/run') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' })
    void runSession(url.searchParams.get('tag') ?? 'run', res)
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, () => {
  console.log(`▶ YVON orchestrator listening on :${PORT} (health: /health)`)
})
