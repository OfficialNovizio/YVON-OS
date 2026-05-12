// ── POST /api/tech-chat ────────────────────────────────────────────────────────
// Technical team smart router.
// Receives a plain-English message and automatically routes to the most
// relevant technical agent based on keyword matching.
//
// Body: { message, projectId, projectName, history? }
//
// SSE events:
//   { type: 'agent',   agentId, agentName, agentRole, color }
//   { type: 'text',    content }
//   { type: 'error',   message }
//   [DONE]

import { streamSynthesis } from '@/lib/ai-client'
import { getAgent } from '@/lib/agents'
import type { AgentId } from '@/lib/types'

// ── Routing table ─────────────────────────────────────────────────────────────
// Each entry: { keywords[], agentId, weight }
// The agent with the highest keyword-match weight wins.
// Ties: first match in list wins (list is priority-ordered).

interface RoutingRule {
  keywords: string[]
  agentId:  AgentId
}

const ROUTING_RULES: RoutingRule[] = [
  // QA / bugs — Quinn first, she often needs Dev too but we route to Quinn alone
  {
    keywords: ['bug', 'fix', 'broken', 'crash', 'error', 'fails', 'failing', 'not working', 'issue', 'test', 'spec', 'qa', 'quality', 'review code', 'edge case', 'regression'],
    agentId: 'quinn-qa',
  },
  // Backend / data — Raj
  {
    keywords: ['api', 'endpoint', 'route.ts', 'database', 'query', 'schema', 'migration', 'backend', 'server', 'supabase', 'postgres', 'sql', 'model', 'prisma', 'drizzle', 'webhook'],
    agentId: 'raj-backend',
  },
  // Frontend / React + UI/UX — Mia (absorbed Leo's UX domain)
  {
    keywords: ['component', 'ui', 'layout', 'css', 'tailwind', 'style', 'responsive', 'mobile', 'animation', 'navbar', 'sidebar', 'modal', 'button', 'form', 'react', 'tsx', 'page design', 'looks', 'wireframe', 'mockup', 'design system', 'color palette', 'typography', 'spacing', 'ux flow', 'user flow'],
    agentId: 'mia-frontend',
  },
  // Product planning — Diana (absorbed Priya's PM domain)
  {
    keywords: ['feature spec', 'user story', 'acceptance criteria', 'sprint', 'roadmap', 'scope', 'requirements', 'plan the', 'planning', 'milestone', 'backlog'],
    agentId: 'diana-coo',
  },
  // Catch-all technical — Dev Lead handles architecture, new pages, general code
  {
    keywords: ['architecture', 'refactor', 'new page', 'implement', 'build', 'add feature', 'create', 'typescript', 'next.js', 'performance', 'deploy', 'how do i', 'how should', 'best way', 'auth'],
    agentId: 'dev-lead',
  },
]

// Default if nothing matches
const DEFAULT_AGENT: AgentId = 'dev-lead'

function routeToAgent(message: string): AgentId {
  const lower = message.toLowerCase()
  let bestAgent: AgentId = DEFAULT_AGENT
  let bestScore = 0

  for (const rule of ROUTING_RULES) {
    const score = rule.keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestAgent = rule.agentId
    }
  }
  return bestAgent
}

// ── Agent display metadata ─────────────────────────────────────────────────────
const AGENT_META: Record<string, { color: string; emoji: string }> = {
  'dev-lead':        { color: '#60A0E0', emoji: '💻' },
  'raj-backend':     { color: '#818CF8', emoji: '🔧' },
  'mia-frontend':    { color: '#F472B6', emoji: '🎨' },
  'quinn-qa':        { color: '#34D399', emoji: '🧪' },
  'diana-coo':       { color: '#94A3B8', emoji: '⚙️' },
}

// ── System prompt injection ───────────────────────────────────────────────────
function buildSystemPrompt(agentId: AgentId, projectName: string, projectStack: string): string {
  const agent = getAgent(agentId)
  const base  = agent?.systemPrompt ?? `You are ${agentId}, a technical expert.`

  return `${base}

---
ACTIVE PROJECT: ${projectName}
TECH STACK: ${projectStack}

IMPORTANT INSTRUCTIONS FOR THIS CHAT:
- The user is talking to you through Code Hub in the YVON dashboard.
- You have direct access to the ${projectName} codebase (if mounted).
- When you write code changes, ALWAYS output them in this exact JSON format at the end of your response so the user can propose them with one click:

\`\`\`proposal
{
  "commitMessage": "brief description of change",
  "branchName": "type/short-description",
  "files": [
    { "path": "relative/path/to/file.ts", "content": "FULL file content here" }
  ]
}
\`\`\`

- Only output a proposal block when you have actual complete code to commit.
- If you need more information (file content, requirements), ask for it naturally — don't force a proposal.
- Keep responses focused and practical. Code over commentary.`
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  let body: { message?: string; projectId?: string; projectName?: string; projectStack?: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const message      = body.message ?? ''
  const projectName  = body.projectName  ?? 'Unknown Project'
  const projectStack = body.projectStack ?? ''
  const history      = body.history ?? []

  if (!message) return Response.json({ error: 'message required' }, { status: 400 })

  // Route to agent
  const agentId  = routeToAgent(message)
  const agent    = getAgent(agentId)
  const meta     = AGENT_META[agentId] ?? { color: '#888888', emoji: '🤖' }
  const sysPrompt = buildSystemPrompt(agentId, projectName, projectStack)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function emit(type: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
        )
      }

      try {
        // Announce which agent is responding
        emit('agent', {
          agentId,
          agentName: agent?.name ?? agentId,
          agentRole: agent?.role ?? '',
          color:     meta.color,
          emoji:     meta.emoji,
        })

        const messages = [
          ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user' as const, content: message },
        ]

        for await (const chunk of streamSynthesis({ system: sysPrompt, messages, maxTokens: 2048 })) {
          emit('text', { content: chunk })
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
