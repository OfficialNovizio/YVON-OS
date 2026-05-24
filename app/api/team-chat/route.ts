import { NextRequest } from 'next/server'
import { getAgent, AGENTS } from '@/lib/agents'
import { callFast, streamSynthesis, streamWithTools } from '@/lib/ai-client'
import { resolveVentureRepo, getRepoInfo, listCommits, listIssues, getRepoTree } from '@/lib/github'
import { getAllVentureDocs } from '@/lib/venture-documents'
import { getAgentMemory } from '@/lib/agent-memory'
import { getSecret } from '@/lib/secrets'

export const maxDuration = 300
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration } from '@/lib/collaboration-manager'
import { routingFeedback } from '@/lib/routing-feedback'
import { monitoring } from '@/lib/monitoring'
import { saveWarRoomPlan, saveAgentSession, prefetchAgentMemory, searchSkills, trackSkillUsage } from '@/lib/db'
import type { RoutingResult, SpecialistBriefing, AgentId, ExecutionPlan, ConflictItem } from '@/lib/types'

// ─── GitHub snapshot pre-fetcher ───────────────────────────────────────────────
// Resolves the venture's configured repo and pulls a ground-truth snapshot
// (repo info + recent commits + open issues + top-level file list) so agents
// don't have to burn tool calls re-discovering it. Cached 60s per slug.

interface RepoSnapshot {
  owner:        string
  repo:         string
  branch:       string
  description:  string | null
  isPrivate:    boolean
  stars:        number
  openIssues:   number
  updatedAt:    string
  url:          string
  topLevelFiles: string[]
  recentCommits: Array<{ sha: string; message: string; author: string; date: string }>
  openIssuesSample: Array<{ number: number; title: string; labels: string[] }>
}

async function prefetchVentureGithubSnapshot(slug: string | undefined): Promise<{ snapshot: RepoSnapshot | null; error?: string }> {
  if (!slug) return { snapshot: null, error: 'No venture slug supplied with this request.' }
  // No cache — always fetch live from GitHub API + the Supabase venture record.
  try {
    const { owner, repo, repoUrl } = await resolveVentureRepo(slug)
    const [info, commits, issues, tree] = await Promise.all([
      getRepoInfo(owner, repo),
      listCommits(owner, repo, 5),
      listIssues(owner, repo, 'open'),
      getRepoTree(owner, repo, 'main').catch(() => ({ files: [], truncated: false })),
    ])
    // Top-level directories/files only
    const topPaths = new Set<string>()
    for (const f of tree.files) {
      const seg = f.path.split('/')[0]
      if (seg) topPaths.add(seg)
      if (topPaths.size >= 30) break
    }
    const snapshot: RepoSnapshot = {
      owner, repo,
      branch:       info.defaultBranch,
      description:  info.description,
      isPrivate:    info.private,
      stars:        info.stars,
      openIssues:   info.openIssues,
      updatedAt:    info.updatedAt,
      url:          repoUrl,
      topLevelFiles: Array.from(topPaths).sort(),
      recentCommits: commits.map(c => ({ sha: c.sha, message: c.message, author: c.author, date: c.date })),
      openIssuesSample: issues.slice(0, 8).map(i => ({ number: i.number, title: i.title, labels: i.labels })),
    }
    return { snapshot }
  } catch (e) {
    return { snapshot: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Venture docs (DB-backed) ─────────────────────────────────────────────────
// Pulls CONTEXT/BRAND/DESIGN/FEEDBACK from Supabase's venture_documents table.
// Replaces filesystem reads of docs/ventures/[slug]/*.md.

async function loadVentureContextBlock(slug: string | undefined): Promise<string> {
  if (!slug) return ''
  try {
    const docs = await getAllVentureDocs(slug)
    const parts: string[] = []
    // Keep each section short — full content can be 2000+ chars and is duplicated per specialist
    const cap = (text: string, max: number) => text.length > max ? text.slice(0, max) + '\n…[truncated]' : text
    if (docs.context.content.trim())   parts.push(`<venture-context-doc>\n${cap(docs.context.content, 1500)}\n</venture-context-doc>`)
    if (docs.brand.content.trim())     parts.push(`<venture-brand-doc>\n${cap(docs.brand.content, 1500)}\n</venture-brand-doc>`)
    if (docs.design.content.trim())    parts.push(`<venture-design-doc>\n${cap(docs.design.content, 1500)}\n</venture-design-doc>`)
    if (docs.feedback.content.trim())  parts.push(`<venture-feedback-doc>\n${cap(docs.feedback.content, 1500)}\n</venture-feedback-doc>`)
    return parts.join('\n\n')
  } catch {
    return ''
  }
}

function formatGithubSnapshot(s: RepoSnapshot): string {
  const lines = [
    `Repo:          ${s.owner}/${s.repo}  ${s.isPrivate ? '(private)' : '(public)'}`,
    `Description:   ${s.description ?? '(none)'}`,
    `URL:           ${s.url}`,
    `Default branch: ${s.branch}    Stars: ${s.stars}    Open issues: ${s.openIssues}`,
    `Last updated:  ${s.updatedAt}`,
    ``,
    `Top-level structure (${s.topLevelFiles.length}):`,
    s.topLevelFiles.map(f => `  - ${f}`).join('\n') || '  (empty)',
    ``,
    `Last ${s.recentCommits.length} commits:`,
    s.recentCommits.map(c => `  ${c.sha}  ${c.date.slice(0, 10)}  ${c.author}  ${c.message.slice(0, 80)}`).join('\n') || '  (none)',
    ``,
    `Open issues (showing ${s.openIssuesSample.length}):`,
    s.openIssuesSample.map(i => `  #${i.number} ${i.title}${i.labels.length ? '  [' + i.labels.join(',') + ']' : ''}`).join('\n') || '  (none)',
  ]
  return lines.join('\n')
}

// Agent persona memory now lives in Supabase. Filesystem fallback removed —
// see lib/agent-memory.ts.

type StepResult = {
  agentId: AgentId
  taskBrief: string | null
  outputContent: string | null
  status: 'complete' | 'error' | 'retried'
  retryCount: number
}

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
  // GitHub / Repo Analysis
  github_analysis:     ['dev-lead', 'quinn-qa'],
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

    const text = await callFast({
      maxTokens: 600,
      messages: [{
        role: 'user',
        content: `Marcus CEO. Request: "${message}" Venture: ${ventureName} Specialists: ${agentNames}
Output ONLY valid JSON, no prose:
{"objective":"<goal>","agents":[${specialists.map(s => `"${s}"`).join(',')}],"order":"parallel","each_agent_task":{${specialists.map(s => `"${s}":"<task>"`).join(',')}},"definition_of_done":"<done criteria>"}`,
      }],
    })
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

const TECHNICAL_AGENTS = new Set<AgentId>(['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa'])

async function getSpecialistBriefing(
  agentId: AgentId,
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  githubSnapshot: string | undefined,
  ventureDocs: string | undefined,
  taskOverride: string | undefined,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
): Promise<SpecialistBriefing> {
  const agent = getAgent(agentId)
  if (!agent) return { agentId, content: '' }

  // Phase C: prefetch memory context (FTS + MEMORY.md file)
  // Extract keywords from message for skill search (first 5 words, stripped)
  const keywords = message.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 5).filter(Boolean)

  const [dbMemory, fileMemory, matchedSkills] = await Promise.all([
    prefetchAgentMemory(agentId, ventureName, message),
    getAgentMemory(agentId, ventureName, 600),
    keywords.length > 0 ? searchSkills(keywords, agentId, 3) : Promise.resolve([]),
  ])

  // Track usage for matched skills (fire-and-forget)
  for (const skill of matchedSkills) {
    trackSkillUsage(skill.name).catch(() => {})
  }

  const skillsBlock = matchedSkills.length > 0
    ? `<skills-context>\n[System note: Relevant skills recalled for this task — apply these patterns.]\n\n${matchedSkills.map(s => `**${s.name}**: ${s.description}`).join('\n')}\n</skills-context>`
    : ''

  const memoryBlock = [
    dbMemory,
    fileMemory
      ? `<memory-context>\n[System note: Agent MEMORY.md snapshot — treat as background context, not new input.]\n\n${fileMemory}\n</memory-context>`
      : '',
    skillsBlock,
  ].filter(Boolean).join('\n\n')

  const taskPrompt = taskOverride
    ? `Your specific task: ${taskOverride}`
    : `Answer the following from your area of expertise: ${message}`

  const ghBlock = githubContext && TECHNICAL_AGENTS.has(agentId)
    ? `<github-context>\n[System note: Live repo snapshot fetched when the War Room session opened. Use this as ground truth for the current codebase state.]\n\n${githubContext}\n</github-context>`
    : ''

  const ventureBlock = ventureSlug
    ? `<venture-context>\nActive venture slug: ${ventureSlug}  (name: ${ventureName})\n</venture-context>`
    : `<venture-context>\nActive venture: ${ventureName}  (no slug — Github tool unavailable)\n</venture-context>`

  // Ground-truth snapshot pre-fetched server-side — saves the agent from burning
  // tool calls re-discovering basic repo state. Already has owner/repo, branch,
  // top-level structure, recent commits, open issues.
  const snapshotBlock = githubSnapshot
    ? `<github-snapshot>\n[System note: Live GitHub data fetched at the start of this session — this is ground truth, use it directly.]\n\n${githubSnapshot}\n</github-snapshot>`
    : ''

  const isReport = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
  const toolGuidance = `<tools-available>\nYou have read-only tools. Ground every specific claim in tool output — do NOT guess file paths, code, or contents.\n- Read(file_path): YVON repo (server local)\n- Glob(pattern), Grep(pattern): YVON code search\n- Bash(command): read-only shell (ls/cat/find/git log)\n- WebFetch(url): fetch a URL\n- Github(action): query the VENTURE'S configured GitHub repo (action=repo/tree/file/issues/prs/branches/commits/search). Use this to drill in BEYOND the snapshot above — e.g. to read a specific file, list a subdirectory, or check a particular issue.\n- TodoWrite: plan multi-step work\nThe <github-snapshot> above already has repo existence, branch, top-level structure, recent commits, and open issues — DO NOT waste tool calls re-fetching those. Drill in only when you need specifics.\n${isReport ? 'Cap: ~8 tool calls. Produce a structured markdown report (## sections, bullet points, specific data). 300–400 words.' : 'Cap: ~6 tool calls. End with a 100–150 word answer.'}\n</tools-available>`

  const ventureDocsBlock = ventureDocs
    ? `<venture-docs>\n[Live from Supabase venture_documents — CONTEXT, BRAND, DESIGN, FEEDBACK for the active venture. Use these as the source of truth for venture identity.]\n\n${ventureDocs}\n</venture-docs>`
    : ''

  const systemText = [agent.systemPrompt, memoryBlock, ghBlock, ventureBlock, ventureDocsBlock, snapshotBlock, toolGuidance].filter(Boolean).join('\n\n')

  let content = ''
  const userPrompt = isReport
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}\n\nUse tools to gather real data before writing. Produce a structured markdown report with ## section headers and bullet points. Be specific — include actual numbers, commit messages, issue titles, file names. 300–400 words.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: report\nkey_output: [deliverable]\nconfidence: high\n---END---`
    : `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}\n\nUse tools to explore the repo before answering. Final answer 100–150 words, specific and actionable.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: strategy\nkey_output: [deliverable]\nconfidence: high\n---END---`

  try {
    for await (const event of streamWithTools({
      agentId,
      ventureSlug,
      system:    systemText || undefined,
      maxTokens: isReport ? 3000 : 1500,
      messages: [{ role: 'user', content: userPrompt }],
    })) {
      switch (event.kind) {
        case 'text':
          content += event.text
          break
        case 'tool_call':
          emit('tool_call_start', { agentId, tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
          break
        case 'tool_result':
          emit('tool_call_result', { agentId, tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
          break
        case 'iteration':
          emit('tool_iteration', { agentId, n: event.n })
          break
        case 'error':
          emit('agent_error', { agentId, error: event.message, fatal: false })
          break
        case 'done':
          // loop ended
          break
      }
    }
  } catch (e) {
    emit('agent_error', { agentId, error: String(e), fatal: false })
  }

  return { agentId, content }
}

// ─── Specialist with Retry ─────────────────────────────────────────────────────

async function getSpecialistWithRetry(
  agentId: AgentId,
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  githubSnapshot: string | undefined,
  ventureDocs: string | undefined,
  taskOverride: string | undefined,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
): Promise<SpecialistBriefing> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const briefing = await getSpecialistBriefing(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskOverride, emit, githubContext, imageNote)
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

// ─── Conflict Detection ────────────────────────────────────────────────────────

async function detectConflicts(briefings: SpecialistBriefing[]): Promise<ConflictItem[]> {
  const valid = briefings.filter(b => b.content)
  if (valid.length < 2) return []

  const summaries = valid.map(b => {
    const agent = getAgent(b.agentId)
    return `${b.agentId} (${agent?.name ?? b.agentId}): ${b.content.slice(0, 400)}`
  }).join('\n\n---\n\n')

  try {
    const text = await callFast({
      maxTokens: 300,
      messages: [{
        role: 'user',
        content: `Identify genuine disagreements between these specialist outputs. Return a JSON array only (empty [] if no real conflicts — minor phrasing differences don't count):\n\n${summaries}\n\nJSON format:\n[{"topic":"what they disagree on (max 8 words)","agentA":"agent-id","positionA":"their stance (max 20 words)","agentB":"agent-id","positionB":"their stance (max 20 words)"}]`,
      }],
    })
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0]) as ConflictItem[]
  } catch {
    return []
  }
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
  ventureSlug: string | undefined,
  githubSnapshot: string | undefined,
  ventureDocs: string | undefined,
  executionPlan: ExecutionPlan | null,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
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

    const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskWithContext, emit, githubContext, imageNote)
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
  // Removed ANTHROPIC_API_KEY check — now uses saved provider keys from Supabase

  let message: string
  let ventureName: string
  let ventureSlug: string | undefined
  let githubContext: string | undefined
  let imageBase64:  string | undefined
  let imageMimeType: string | undefined
  let conversationHistory: Array<{ user: string; marcus: string }>
  let approved: boolean
  let previousPlan: ExecutionPlan | undefined
  let previousRouting: RoutingResult | undefined
  try {
    const body = await request.json() as {
      message?: string
      ventureId?: string
      ventureName?: string
      ventureSlug?: string
      githubContext?: string
      imageBase64?: string
      imageMimeType?: string
      conversationHistory?: Array<{ user: string; marcus: string }>
      approved?: boolean
      previousPlan?: ExecutionPlan
      previousRouting?: RoutingResult
    }
    message             = body.message ?? ''
    ventureName         = body.ventureName ?? 'Novizio'
    ventureSlug         = body.ventureSlug
    githubContext       = body.githubContext
    imageBase64         = body.imageBase64
    imageMimeType       = body.imageMimeType
    conversationHistory = body.conversationHistory ?? []
    approved            = body.approved ?? false
    previousPlan        = body.previousPlan
    previousRouting     = body.previousRouting
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

      // Heartbeat — keeps the connection alive during long Qwen3 thinking phases
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { /* stream closed */ }
      }, 15_000)

      try {
        // ── Step 0: Direct-response check ───────────────────────────────────
        // No LLM call — instant heuristic. Short messages or no domain keywords
        // go straight to Marcus. Only explicit task/domain keywords trigger the pipeline.
        const TASK_KEYWORDS = /\b(analys|strateg|campaign|budget|revenue|content|copy|ad\b|post|instagram|tiktok|youtube|linkedin|competitor|market|launch|product|feature|bug|deploy|build|code|database|seo|funnel|roas|cac|ltv|mrr|p&l|roi|sprint|okr|brief|report|audit|research|growth|email|brand|github|repo|repository|codebase|commit|issue|pull.?request|pr\b|branch)\b/i
        const isDirect = message.trim().length < 80 && !TASK_KEYWORDS.test(message)
        // Even on the direct path, if the user is asking Marcus to check/verify/explore something —
        // give him tools so he doesn't hallucinate file paths, repo existence, etc.
        const EXPLORATION_KEYWORDS = /\b(check|look|read|explore|verify|inspect|find|search|github|repo|repository|codebase|file|directory|commit|issue|pr\b|branch|exists?|status)\b/i
        const needsTools = EXPLORATION_KEYWORDS.test(message)

        if (isDirect) {
          // Marcus answers directly — stream straight to the client
          emit('routing', {
            routing: { intent: 'direct', specialists: [], reasoning: 'Direct Marcus response' },
            confidence: 1,
          })
          emit('plan', {
            plan: {
              objective: message,
              agents: [],
              order: 'parallel',
              each_agent_task: {},
              definition_of_done: 'Marcus responds directly.',
            },
            routing: { intent: 'direct', specialists: [] },
          })

          const directHistoryBlock = conversationHistory.length > 0
            ? `\n\nPrior conversation:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus.slice(0, 200)}…`).join('\n\n')}`
            : ''
          const directImageNote = imageBase64 ? `\n\n[The user attached an image — analyze it visually as part of your reply.]` : ''

          const directBasePrompt = `You are Marcus, CEO of YVON (venture: ${ventureName}). The user said: "${message}"${directImageNote}${directHistoryBlock}\n\nReply naturally and concisely as Marcus. No agent delegation needed.`

          let directSynthesis = ''
          if (needsTools) {
            // Exploration question — Marcus uses tools to ground his answer.
            // Pre-fetch snapshot + venture docs in parallel so direct-Marcus has the same context
            const [directSnap, directVentureDocs] = await Promise.all([
              prefetchVentureGithubSnapshot(ventureSlug),
              loadVentureContextBlock(ventureSlug),
            ])
            const directSnapText = directSnap.snapshot ? formatGithubSnapshot(directSnap.snapshot) : ''
            emit('github_snapshot', {
              ok:        !!directSnap.snapshot,
              repo:      directSnap.snapshot ? `${directSnap.snapshot.owner}/${directSnap.snapshot.repo}` : null,
              branch:    directSnap.snapshot?.branch ?? null,
              openIssues: directSnap.snapshot?.openIssues ?? null,
              error:     directSnap.error ?? null,
            })
            const toolSystem = `You are Marcus, CEO of YVON. Active venture: ${ventureName} (slug: ${ventureSlug ?? 'unknown'}).\n\nYou have read-only tools (Read/Glob/Grep/Bash/WebFetch/Github/TodoWrite).${directSnapText ? `\n\n<github-snapshot>\n[Live GitHub data — ground truth]\n\n${directSnapText}\n</github-snapshot>` : ''}${directVentureDocs ? `\n\n<venture-docs>\n[Live from Supabase — source of truth for this venture]\n\n${directVentureDocs}\n</venture-docs>` : ''}\n\nThe snapshot + docs above are ground truth. Don't re-fetch what's already in them. Drill in only when you need specifics. End with a concise answer.`
            for await (const event of streamWithTools({
              agentId:     'marcus-ceo',
              ventureSlug,
              system:      toolSystem,
              maxTokens:   2000,
              messages:    [{ role: 'user', content: directBasePrompt }],
            })) {
              if (event.kind === 'text') {
                directSynthesis += event.text
                emit('text', { content: event.text })
              } else if (event.kind === 'tool_call') {
                emit('tool_call_start', { agentId: 'marcus-ceo', tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
              } else if (event.kind === 'tool_result') {
                emit('tool_call_result', { agentId: 'marcus-ceo', tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
              } else if (event.kind === 'error') {
                emit('agent_error', { agentId: 'marcus-ceo', error: event.message, fatal: false })
              }
            }
          } else {
            // Quick chat — no tools needed, fastest path
            for await (const chunk of streamSynthesis({
              maxTokens: 1500,
              imageBase64,
              imageMimeType,
              messages: [{ role: 'user', content: directBasePrompt }],
            })) {
              directSynthesis += chunk
              emit('text', { content: chunk })
            }
          }

          const elapsed = Date.now() - startTime
          emit('plan_complete', { elapsed })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          saveWarRoomPlan({
            ventureName,
            userPrompt:  message,
            intent:      'direct',
            plan:        null,
            agentsUsed:  [],
            status:      'complete',
            synthesis:   directSynthesis,
            elapsedMs:   elapsed,
            steps:       [],
          }).catch(() => {})

          controller.close()
          return
        }

        // ── Step 0.5: Pre-fetch GitHub snapshot + venture docs in parallel ──
        // Both surface ground-truth state to every downstream agent in their system prompt.
        const snapshotPromise = prefetchVentureGithubSnapshot(ventureSlug)
        const ventureDocsPromise = loadVentureContextBlock(ventureSlug)

        // ── Steps 1 + 2: Classify intent + build plan (skip if already approved) ──
        // ⛔ WORKFLOW RULE 4 — DO NOT REMOVE THIS GATE.
        // PERFORMING (specialist execution) must never start without user approval.
        // Phase 1: classify + build plan → emit plan_approval_required → close stream.
        // Phase 2: client resends with approved=true → skip to specialist execution.
        // This has been re-implemented 5+ times because it was accidentally deleted.
        // Source of truth: docs/WORKFLOW.md § "Phase 0 — ENGAGE + PLAN"
        let routing: RoutingResult
        let executionPlan: ExecutionPlan

        if (approved && previousPlan && previousRouting) {
          // Phase 2: user approved the plan — use it directly
          routing = previousRouting
          executionPlan = previousPlan
        } else {
          // Phase 1: classify + plan, then wait for approval
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

          executionPlan =
            (await buildExecutionPlan(message, ventureName, routing.specialists as AgentId[]))
            ?? fallbackPlan(routing.specialists as AgentId[], message)

          // Emit plan for UI, then emit approval gate — stream closes here.
          // The UI renders EngagePlanCard; on "Go ahead" the client re-calls
          // with approved=true + previousPlan + previousRouting to execute Phase 2.
          const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])
          emit('routing', { routing, confidence })
          emit('plan', { plan: executionPlan, routing })
          emit('plan_approval_required', { plan: executionPlan, routing })
          emit('plan_complete', { elapsed: Date.now() - startTime })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat)
          controller.close()
          return
        }

        const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])
        emit('routing', { routing, confidence })

        // Resolve the snapshot + venture docs now (or surface failure to the UI)
        const [snapResult, ventureDocsText] = await Promise.all([snapshotPromise, ventureDocsPromise])
        const githubSnapshotText = snapResult.snapshot ? formatGithubSnapshot(snapResult.snapshot) : undefined
        emit('github_snapshot', {
          ok:        !!snapResult.snapshot,
          repo:      snapResult.snapshot ? `${snapResult.snapshot.owner}/${snapResult.snapshot.repo}` : null,
          branch:    snapResult.snapshot?.branch ?? null,
          openIssues: snapResult.snapshot?.openIssues ?? null,
          error:     snapResult.error ?? null,
        })

        // Engine in use — surface for diagnostic clarity
        emit('engine', {
          engine: (await getSecret('WAR_ROOM_ENGINE')) === 'agent_sdk' ? 'agent_sdk' : 'client_sdk',
        })

        emit('plan', { plan: executionPlan, routing })

        // ── Step 3: Specialist execution (parallel or sequential) ───────────
        const useSequential = executionPlan.order === 'sequential' && routing.specialists.length > 1
        const imageNote = imageBase64
          ? `\n\n[Context: The user attached an image (${imageMimeType ?? 'image'}). Marcus will analyze it visually in synthesis — factor in that this may be a visual/design/reference asset.]`
          : undefined

        let briefings: SpecialistBriefing[]
        let stepResults: StepResult[]

        if (useSequential) {
          const result = await executeSequential(
            routing.specialists as AgentId[],
            message,
            ventureName,
            ventureSlug,
            githubSnapshotText,
            ventureDocsText,
            executionPlan,
            emit,
            githubContext,
            imageNote,
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

              const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshotText, ventureDocsText, task, emit, githubContext, imageNote)
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

        // Conflict detection skipped — saves one LLM call on local models

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

        const historyBlock = conversationHistory.length > 0
          ? `\n\nPrior conversation context:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus.slice(0, 200)}…`).join('\n\n')}`
          : ''
        const ceoImageNote = imageBase64
          ? `\n\n[The user attached an image — analyze it visually as part of your synthesis.]`
          : ''

        const isReportRequest = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
        const ceoPrompt = isReportRequest
          ? `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists delivered:
${briefingText}

User: ${message}${ceoImageNote}${historyBlock}

Produce a comprehensive executive report. Structure it as:
## Executive Summary (2–3 sentences)
## Key Findings (bullet points with specific data from specialists)
## Risks / Open Items (what needs attention)
## Recommended Next Actions (ranked by priority)

Use real data from the specialist reports. Do not hedge with "I think" — state what the data shows. 300–500 words total.

You have read-only tools (Read/Glob/Grep/Github/etc.). Verify uncertain claims with tools before writing.`
          : `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists delivered:
${briefingText}

User: ${message}${ceoImageNote}${historyBlock}

Give a concise unified response in 150 words max. Start with: "The one thing I don't know here is..." then your recommendation.

You have read-only tools (Read/Glob/Grep/Github/etc.). If a specialist's claim seems uncertain or the user asked about repo/file/commit state, verify with tools BEFORE writing your synthesis. Never say "I don't know if the repo exists" without calling Github(action=repo) first.`

        const ceoSnapshotBlock = githubSnapshotText
          ? `\n\n<github-snapshot>\n[Live GitHub data — ground truth, refer to it directly]\n\n${githubSnapshotText}\n</github-snapshot>`
          : ''
        const ceoVentureDocsBlock = ventureDocsText
          ? `\n\n<venture-docs>\n[Live from Supabase venture_documents — source of truth for this venture's identity, brand, design, context, feedback]\n\n${ventureDocsText}\n</venture-docs>`
          : ''
        const ceoSystem = `You are Marcus, CEO of YVON synthesising specialist briefings. Active venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}.\n\nYour job: produce a single unified 150-word answer for the user. Use the read-only tool palette ONLY when a claim needs verification or when the user asked about repo/code state. Don't pad with unnecessary tool calls — the specialists already did the heavy exploration.${ceoSnapshotBlock}${ceoVentureDocsBlock}`

        let ceoSynthesis = ''
        const ceoMaxTokens = isReportRequest ? 4000 : 2000
        // Only stream image into synthesis if no tools needed (Anthropic tool_use API + image
        // in the same turn is finicky across the DeepSeek compat layer). If user attached an
        // image, prefer plain stream so visual analysis stays high-quality.
        if (imageBase64) {
          for await (const chunk of streamSynthesis({
            maxTokens: ceoMaxTokens,
            imageBase64,
            imageMimeType,
            messages: [{ role: 'user', content: ceoPrompt }],
          })) {
            ceoSynthesis += chunk
            emit('text', { content: chunk })
          }
        } else {
          for await (const event of streamWithTools({
            agentId:     'marcus-ceo',
            ventureSlug,
            modelTier:   'synthesis',
            system:      ceoSystem,
            maxTokens:   ceoMaxTokens,
            maxIterations: isReportRequest ? 6 : 4,   // synthesis: tighter cap, briefings already explored
            messages:    [{ role: 'user', content: ceoPrompt }],
          })) {
            if (event.kind === 'text') {
              ceoSynthesis += event.text
              emit('text', { content: event.text })
            } else if (event.kind === 'tool_call') {
              emit('tool_call_start', { agentId: 'marcus-ceo', tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
            } else if (event.kind === 'tool_result') {
              emit('tool_call_result', { agentId: 'marcus-ceo', tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
            } else if (event.kind === 'error') {
              emit('agent_error', { agentId: 'marcus-ceo', error: event.message, fatal: false })
            }
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
          synthesis:   ceoSynthesis || briefingText,
          elapsedMs:   elapsed,
          steps:       stepResults,
        }).catch(err => {
          monitoring.warn('War Room plan persistence failed (non-fatal)', { error: String(err) })
        })

        // Hermes Phase 1: save individual agent sessions for cross-session memory
        // Hermes SIP: trigger self-improvement analysis per agent (fire-and-forget)
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'
        for (const step of stepResults) {
          if (!step.outputContent) continue

          // Save to DB (venture-scoped agent_sessions table)
          saveAgentSession({
            agentId:      step.agentId,
            venture:      ventureName,
            task:         step.taskBrief ?? message,
            outcome:      step.outputContent.slice(0, 500),
            systemTarget: null,
            tokensUsed:   null,
            durationMs:   elapsed,
          }).catch(() => { /* non-fatal */ })

          // SIP: AI-driven session analysis → auto-update SKILLS.md if patterns emerge
          fetch(`${baseUrl}/api/memory/enhanced`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              agentId:  step.agentId,
              venture:  ventureName,
              task:     step.taskBrief ?? message,
              outcome:  step.outputContent.slice(0, 400),
            }),
          }).catch(() => { /* non-fatal — SIP never breaks the session */ })
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        emit('error', { message: msg })
      } finally {
        clearInterval(heartbeat)
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
