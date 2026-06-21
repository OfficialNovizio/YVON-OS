/**
 * lib/chat-session.ts — Persistent Agent Chat Sessions
 *
 * Each venture gets ONE active chat session with Marcus (CEO).
 * Context is fingerprinted — rebuilt only when source files change.
 * Specialist agents delegated via "DELEGATE: <agent> <task>" pattern.
 *
 * Reuses hermes-spawn.ts for agent execution, adds:
 *   - Session store (in-memory, per venture)
 *   - Context fingerprinting (mtime-based)
 *   - Delta injection (only changed files)
 *   - Message history (last 10 messages)
 *   - Specialist delegation (Marcus → subagents)
 */

import { spawnHermesAgent, type HermesAgentResult, type HermesSpawnParams } from './hermes-spawn'
import { promises as fs } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VentureSession {
  venture: string
  workdir: string
  agentId: string          // 'yvon/marcus-ceo'
  context: CachedContext | null
  messages: Array<{ role: 'user' | 'agent'; content: string }>
  createdAt: number
  lastActivity: number
  totalTokens: number
}

interface CachedContext {
  fingerprint: string
  builtAt: number
  totalTokens: number
  // The actual context strings
  systemContext: string
}

// ─── In-Memory Store ─────────────────────────────────────────────────────────

const sessions = new Map<string, VentureSession>()

// Venture workdirs
const VENTURES: Record<string, { workdir: string; name: string }> = {
  novizio:  { workdir: '/root/novizio',  name: 'Novizio' },
  hourbour: { workdir: '/root/hourbour', name: 'Hourbour' },
  yvon:     { workdir: '/root/yvon',     name: 'YVON OS' },
}

// ─── Fingerprinting ──────────────────────────────────────────────────────────

async function fingerprintSources(workdir: string): Promise<string> {
  const hash = createHash('sha256')
  const sources = [
    '.toon/docs/CONSTITUTION.toon',
    '.toon/agents/CEO/marcus/MEMORY.md',
    '.toon/graph/unified.db',
    'docs/',
    '.toon/docs/',
  ]
  for (const src of sources) {
    const full = join(workdir, src)
    try {
      if (src.endsWith('/')) {
        const entries = await fs.readdir(full).catch(() => [])
        for (const e of entries.slice(0, 10)) {
          try {
            const s = await fs.stat(join(full, e))
            hash.update(`${src}${e}:${s.mtimeMs}:${s.size}`)
          } catch {}
        }
      } else {
        const s = await fs.stat(full)
        hash.update(`${src}:${s.mtimeMs}:${s.size}`)
      }
    } catch { hash.update(`${src}:MISSING`) }
  }
  return hash.digest('hex').slice(0, 12)
}

// ─── Session API ─────────────────────────────────────────────────────────────

export function getVentureSession(venture: string): VentureSession | undefined {
  for (const [_, s] of sessions) {
    if (s.venture === venture && Date.now() - s.lastActivity < 3600_000) return s
  }
  return undefined
}

export function getOrCreateSession(venture: string): VentureSession {
  const existing = getVentureSession(venture)
  if (existing) return existing

  const v = VENTURES[venture]
  if (!v) throw new Error(`Unknown venture: ${venture}`)

  const session: VentureSession = {
    venture,
    workdir: v.workdir,
    agentId: 'yvon/marcus-ceo',
    context: null,
    messages: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
    totalTokens: 0,
  }
  sessions.set(`${venture}-${session.createdAt}`, session)
  return session
}

export async function sendChatMessage(
  venture: string,
  message: string,
  onChunk?: (text: string) => void
): Promise<{ content: string; tokens: number; deltaDetected: boolean }> {
  const session = getOrCreateSession(venture)
  session.messages.push({ role: 'user', content: message })
  session.lastActivity = Date.now()

  // Check fingerprint — rebuild context only if changed
  const fp = await fingerprintSources(session.workdir)
  let deltaDetected = false
  let deltaBlock = ''

  if (!session.context || session.context.fingerprint !== fp) {
    // Rebuild full context
    // We build context inline in this module
    session.context = await buildSystemContext(session.workdir, VENTURES[venture].name)
    session.context.fingerprint = fp
    session.context.builtAt = Date.now()
    deltaDetected = true
  } else {
    // Context unchanged — no re-injection needed
    // Check for delta (files changed since last message)
    const deltaSources = ['.toon/graph/unified.db', '.toon/docs/']
    for (const src of deltaSources) {
      const full = join(session.workdir, src)
      try {
        if (src.endsWith('/')) continue  // docs dir handled by fingerprint
        const s = await fs.stat(full)
        if (session.context && s.mtimeMs > session.context.builtAt) {
          deltaBlock += `[UPDATED] ${src}\n`
          deltaDetected = true
        }
      } catch {}
    }
  }

  // Build prompt
  const ctx = session.context!
  const history = session.messages
    .slice(-8)
    .map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 400)}`)
    .join('\n\n')

  const fullTask = `${ctx.systemContext}\n\n## Delta (file changes since last context build)\n${deltaBlock || 'none'}\n\n## Conversation History\n${history}\n\n## Current Request\n${message}\n\n## Instructions\n- Use tools to inspect before claiming\n- If delegating to specialist, respond with: DELEGATE: <agent-id> <task>\n- Be concise — you are the CEO`

  // Determine agent — check if message mentions specialist dispatch
  const agentId = detectDelegation(message) || session.agentId

  // Spawn
  const result = await spawnHermesAgent({
    agentId,
    task: fullTask,
    workdir: session.workdir,
    maxOutputTokens: 2048,
    timeoutMs: 180_000,
  })

  session.messages.push({ role: 'agent', content: result.content })
  session.totalTokens += Math.round(result.content.length / 4)

  if (onChunk) onChunk(result.content)

  return {
    content: result.content,
    tokens: Math.round(result.content.length / 4),
    deltaDetected,
  }
}

// ─── Context Builder ─────────────────────────────────────────────────────────

async function buildSystemContext(workdir: string, ventureName: string): Promise<CachedContext> {
  let constitution = '', memory = '', graph = ''

  try { constitution = (await fs.readFile(join(workdir, '.toon/docs/CONSTITUTION.toon'), 'utf-8')).slice(0, 1500) }
  catch { try { constitution = (await fs.readFile(join(workdir, 'docs/CONSTITUTION.md'), 'utf-8')).slice(0, 1500) } catch {} }

  try { memory = (await fs.readFile(join(workdir, '.toon/agents/CEO/marcus/MEMORY.md'), 'utf-8')).slice(0, 1000) } catch {}

  try {
    const { execSync } = require('child_process')
    graph = execSync(
      `python3 -c "import sqlite3,json; db=sqlite3.connect('${join(workdir, '.toon/graph/unified.db').replace(/'/g, "\\'")}'); n=db.execute('SELECT COUNT(*) FROM unified_nodes').fetchone()[0]; e=db.execute('SELECT COUNT(*) FROM unified_edges').fetchone()[0]; db.close(); print(f'Graph: {n} nodes, {e} edges')"`,
      { encoding: 'utf-8', timeout: 3000 }
    ).trim()
  } catch { graph = 'Graph unavailable' }

  const systemContext = [
    `## YVON CONSTITUTION\n${constitution || 'Not loaded'}`,
    `## Agent Memory\n${memory || 'Not loaded'}`,
    `## Knowledge Graph\n${graph}`,
    `\nActive venture: ${ventureName}. Workdir: ${workdir}.`,
  ].join('\n\n')

  return {
    fingerprint: '',
    builtAt: Date.now(),
    totalTokens: Math.round(systemContext.length / 4),
    systemContext,
  }
}

// ─── Specialist Delegation Detection ─────────────────────────────────────────

function detectDelegation(message: string): string | null {
  // Pattern: @dev-lead, @mia-frontend, @quinn-qa, etc.
  const match = message.match(/@(dev-lead|raj-backend|mia-frontend|quinn-qa|kai-analyst|lena-brand|rio-ads|nate-growth|felix-finance|diana-coo|kahneman-psychology)/)
  if (match) return `yvon/${match[1]}`
  return null
}

export function closeVentureSession(venture: string): boolean {
  for (const [id, s] of sessions) {
    if (s.venture === venture) {
      sessions.delete(id)
      return true
    }
  }
  return false
}
