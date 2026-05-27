import { NextRequest } from 'next/server'
import { getAgent, AGENTS } from '@/lib/agents'
import { callFast, streamSynthesis, streamWithTools, getActiveProviderInfo } from '@/lib/ai-client'
import { resolveVentureRepo, getRepoInfo, listCommits, listIssues, getRepoTree } from '@/lib/github'
import { getAllVentureDocs } from '@/lib/venture-documents'
import { getAgentMemory } from '@/lib/agent-memory'
import { getSecret } from '@/lib/secrets'

export const maxDuration = 300

// YVON OS project root — used in agent system prompts to scope filesystem tool access.
// process.cwd() is the Next.js project root on both dev and production.
const YVON_OS_PATH = process.cwd()
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration } from '@/lib/collaboration-manager'
import { routingFeedback } from '@/lib/routing-feedback'
import { monitoring } from '@/lib/monitoring'
import { saveWarRoomPlan, updateWarRoomPlan, saveAgentSession, prefetchAgentMemory, searchSkills, trackSkillUsage } from '@/lib/db'
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
    const info = await getRepoInfo(owner, repo)
    const [commits, issues, tree] = await Promise.all([
      listCommits(owner, repo, 5).catch(() => []),
      listIssues(owner, repo, 'open').catch(() => []),   // issues may be disabled on the repo
      getRepoTree(owner, repo, info.defaultBranch).catch(() => ({ files: [], truncated: false })),
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

const FALLBACK_TASK_TEMPLATES: Partial<Record<AgentId, (msg: string) => string>> = {
  'dev-lead':           msg => `Review the codebase architecture, structure, and technical health. Context: ${msg.slice(0, 80)}`,
  'quinn-qa':           msg => `Audit code quality, test coverage, open issues, and flag any risks. Context: ${msg.slice(0, 80)}`,
  'raj-backend':        msg => `Examine backend architecture, API routes, database schema, and server-side logic. Context: ${msg.slice(0, 80)}`,
  'mia-frontend':       msg => `Review UI components, design system, and frontend structure. Context: ${msg.slice(0, 80)}`,
  'marcus-ceo':         msg => `Provide executive synthesis and strategic recommendations. Context: ${msg.slice(0, 80)}`,
  'diana-coo':          msg => `Assess operational processes, workflows, and execution readiness. Context: ${msg.slice(0, 80)}`,
  'kai-analyst':        msg => `Analyze metrics, data signals, and surface key insights. Context: ${msg.slice(0, 80)}`,
  'lena-brand':         msg => `Review brand voice, content strategy, and messaging quality. Context: ${msg.slice(0, 80)}`,
  'rio-ads':            msg => `Analyze paid channel performance, ROAS, and ad strategy. Context: ${msg.slice(0, 80)}`,
  'nate-growth':        msg => `Identify growth opportunities and top-of-funnel optimizations. Context: ${msg.slice(0, 80)}`,
  'felix-finance':      msg => `Analyze financial metrics, P&L, and budget implications. Context: ${msg.slice(0, 80)}`,
  'atlas-art-director': msg => `Review visual identity, creative direction, and brand assets. Context: ${msg.slice(0, 80)}`,
  'pixel-production':   msg => `Coordinate asset production pipeline and delivery. Context: ${msg.slice(0, 80)}`,
  'daniel-kahneman':    msg => `Apply behavioral psychology and cognitive bias analysis to the decision. Context: ${msg.slice(0, 80)}`,
}

// ─── Multi-file Context Note Builder ──────────────────────────────────────────

function isTextMime(mime: string, name: string): boolean {
  return mime.startsWith('text/') ||
    ['application/json','application/xml','application/javascript','application/typescript'].includes(mime) ||
    /\.(ts|tsx|js|jsx|py|md|csv|txt|json|yaml|yml|html|css|sql)$/i.test(name)
}

function buildFilesNote(
  filesArr: Array<{ base64: string; mimeType: string; name: string; isImage: boolean }>,
  variant: 'specialist' | 'ceo' = 'specialist',
): string {
  if (!filesArr || filesArr.length === 0) return ''
  const images = filesArr.filter(f => f.isImage)
  const docs   = filesArr.filter(f => !f.isImage)
  const parts: string[] = []

  if (images.length > 0) {
    const label = images.length === 1
      ? `an image (${images[0].mimeType})`
      : `${images.length} images`
    parts.push(variant === 'ceo'
      ? `[The user attached ${label} — analyze visually in your synthesis.]`
      : `[Context: The user attached ${label}. Marcus will analyze it visually in synthesis.]`)
  }

  for (const file of docs) {
    if (isTextMime(file.mimeType, file.name)) {
      try {
        const decoded = Buffer.from(file.base64, 'base64').toString('utf-8')
        if (variant === 'ceo') {
          parts.push(`[The user attached "${file.name}" — content was shared with specialists above.]`)
        } else {
          parts.push(`[Context: User attached "${file.name}"]\n<attached-file name="${file.name}">\n${decoded.slice(0, 6000)}\n</attached-file>`)
        }
      } catch {
        parts.push(`[Context: User attached "${file.name}" (${file.mimeType}) — could not decode.]`)
      }
    } else {
      parts.push(variant === 'ceo'
        ? `[The user attached "${file.name}" (${file.mimeType}) — content was shared with specialists.]`
        : `[Context: User attached "${file.name}" (${file.mimeType})]`)
    }
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : ''
}

// Fallback plan used when Marcus can't produce valid JSON — ensures orchestration always runs visibly
function fallbackPlan(specialists: AgentId[], message: string): ExecutionPlan {
  return {
    objective: message.slice(0, 120),
    agents: specialists,
    order: 'parallel',
    each_agent_task: Object.fromEntries(
      specialists.map(id => [id, (FALLBACK_TASK_TEMPLATES[id] ?? ((m: string) => m.slice(0, 120)))(message)])
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
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
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

  const isYvonDashboard = !ventureSlug || ventureSlug === 'yvon-dashboard'
  const isLocalMode     = repoMode === 'local'
  const ventureBlock = isYvonDashboard
    ? `<venture-scope>
Active venture: YVON Dashboard (the AI operating system itself)
The active codebase IS the YVON OS at the local filesystem (${YVON_OS_PATH}).
- Read / Bash / Glob / Grep: use freely to explore the YVON Next.js codebase and docs
- Github tool: targets the YVON OS GitHub repo if configured
- All codebase questions refer to the YVON OS itself
</venture-scope>`
    : isLocalMode
    ? `<venture-scope>
Active venture: ${ventureName} (slug: ${ventureSlug}) — LOCAL MODE
The venture's repo is noted at: ${localRepoPath ?? '(path not set — configure in Venture Settings → Profile → Local Repo Path)'}

⚠️ SANDBOX RESTRICTION: Bash / Read / Glob / Grep are sandboxed to the YVON OS project directory (${YVON_OS_PATH}).
They CANNOT access external paths like ${localRepoPath ?? 'the venture repo'} — any attempt will fail with a permission error.

LOCAL MODE — use Github(action=...) for ALL venture codebase access:
- Github(action=file/tree/commits/issues/prs/branches/search): primary tool for ${ventureName} repo
- The <github-snapshot> above already has repo structure, commits, and issues — use it directly
- Do NOT attempt Bash cd or git commands pointing to the venture path — they will be blocked
</venture-scope>`
    : `<venture-scope>
Active venture: ${ventureName} (slug: ${ventureSlug})

⚠️ REPO SCOPE — READ THIS BEFORE USING ANY TOOL:
You are working exclusively for the ${ventureName} venture. Its codebase lives on GitHub (see <github-snapshot> above).

ALLOWED for ${ventureName} questions:
  Github(action=file/tree/commits/issues/prs/branches/search/write_file/delete_file) — the ONLY way to read or write the ${ventureName} codebase

NOT ALLOWED for ${ventureName} questions:
  Read / Bash / Glob / Grep — these access the YVON OS dashboard (/YVON2.0/), a completely separate Next.js codebase. It has NOTHING to do with ${ventureName}.
  Bash git commands (git log, git status, git diff) — these query YVON's git history, NOT ${ventureName}'s. Using them to answer questions about ${ventureName} produces wrong data.

Read / Bash / Glob / Grep are ONLY permitted for: loading your own MEMORY.md, YVON system docs (WORKFLOW.md, SESSION.md), and YVON agent config. For everything else about ${ventureName}, use Github tools.
</venture-scope>`

  // Ground-truth snapshot pre-fetched server-side — saves the agent from burning
  // tool calls re-discovering basic repo state. Already has owner/repo, branch,
  // top-level structure, recent commits, open issues.
  const snapshotBlock = githubSnapshot
    ? `<github-snapshot>\n[System note: Live GitHub data fetched at the start of this session — this is ground truth, use it directly.]\n\n${githubSnapshot}\n</github-snapshot>`
    : ''

  const isReport = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
  // Action task: user wants something DONE in the repo, not just analysed
  const isAction = !isYvonDashboard && /\b(update|add|create|write|change|fix|delete|remove|rename|move|refactor|implement|replace|edit|modify|commit|push|upload|put)\b/i.test(message) && /\b(file|files|repo|code|function|class|config|dart|kt|ts|js|py|json|yaml|yml|md|flutter|android|ios|firebase|pubspec|gradle|manifest|package)\b/i.test(message)
  const ventureRepoLabel = ventureSlug ? `${ventureSlug} app repo` : 'venture app repo'
  const toolGuidance = `<tools-available>
⚠️ TWO COMPLETELY SEPARATE CODEBASES — NEVER CONFUSE THEM:

1. YVON OS (this AI system): Read / Bash / Glob / Grep
   Path: ${YVON_OS_PATH}
   This is the AI operating system dashboard — Next.js, TypeScript, Supabase.
   Git commits, files, and history here belong to YVON, NOT to ${ventureName}.
   NEVER use Bash git commands to answer questions about the venture's product.

2. ${ventureName} app (the actual product): Github(action=...)
   This is the venture's real codebase on GitHub (Flutter app, e-commerce site, etc.).
   ALL questions about "${ventureName}'s codebase / repo / commits / files" → use Github tool ONLY.
   The <github-snapshot> above is the ground truth for this repo.

Tools:
- Read(file_path): read a file from the YVON OS filesystem — YVON docs, agent memory, etc. NOT the ${ventureRepoLabel}.
- Glob(pattern), Grep(pattern): search the YVON OS codebase only.
- Bash(command): read-only shell (ls/cat/find/git log). WARNING: git commands here query YVON's git history, NOT ${ventureName}'s.
- WebFetch(url): fetch a URL.
- Github(action): READ or WRITE the ${ventureName} repo on GitHub.
  Read: repo · tree · file · issues · prs · branches · commits · search
  Write: write_file(path, content, message, branch?) — commit a file directly via GitHub API. delete_file(path, message, branch?) — delete a file.
- TodoWrite: plan multi-step work.

⛔ LOCAL WRITE PROHIBITION: You have zero local filesystem write access. Bash is read-only. Never claim to have written or edited a file locally. The only write path is Github(action=write_file).

The <github-snapshot> already has the ${ventureName} repo structure, commits, and issues — do not re-fetch those. Drill in only when you need file contents or specifics.
${isAction ? 'Cap: ~10 tool calls. Your job is to MAKE THE CHANGE, not describe it. Read the file → edit → write_file → confirm. Do not produce a long report.' : isReport ? 'Cap: ~8 tool calls. Produce a structured markdown report (## sections, bullet points, specific data). 300–400 words.' : 'Cap: ~6 tool calls. End with a 100–150 word answer.'}
</tools-available>`

  const ventureDocsBlock = ventureDocs
    ? `<venture-docs>\n[Live from Supabase venture_documents — CONTEXT, BRAND, DESIGN, FEEDBACK for the active venture. Use these as the source of truth for venture identity.]\n\n${ventureDocs}\n</venture-docs>`
    : ''

  const systemText = [agent.systemPrompt, memoryBlock, ghBlock, ventureBlock, ventureDocsBlock, snapshotBlock, toolGuidance].filter(Boolean).join('\n\n')

  let content = ''
  const userPrompt = isAction
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}\n\nTake direct action — do NOT just describe what to do.\nWorkflow:\n1. If editing an existing file: read it first with Github(action=file, path=...) to get current content\n2. Make the required change\n3. Commit with Github(action=write_file, path=..., content=..., message=...)\n4. If deleting: Github(action=delete_file, path=..., message=...)\nConfirm exactly what was done: file path + commit message. Keep your reply to 3–4 sentences max.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: action\nkey_output: [file path changed]\nconfidence: high\n---END---`
    : isReport
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}\n\nUse tools to gather real data before writing. Produce a structured markdown report with ## section headers and bullet points. Be specific — include actual numbers, commit messages, issue titles, file names. 300–400 words.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: report\nkey_output: [deliverable]\nconfidence: high\n---END---`
    : `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}\n\nUse tools to explore the repo before answering. Final answer 100–150 words, specific and actionable.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: strategy\nkey_output: [deliverable]\nconfidence: high\n---END---`

  try {
    for await (const event of streamWithTools({
      agentId,
      ventureSlug,
      repoMode,
      localRepoPath,
      system:    systemText || undefined,
      maxTokens: isAction ? 2000 : isReport ? 3000 : 1500,
      maxIterations: isAction ? 10 : undefined,
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
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
): Promise<SpecialistBriefing> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const briefing = await getSpecialistBriefing(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskOverride, emit, githubContext, imageNote, repoMode, localRepoPath)
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
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
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

    const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskWithContext, emit, githubContext, imageNote, repoMode, localRepoPath)
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
  let repoMode: 'github' | 'local'
  let localRepoPath: string | undefined
  let githubContext: string | undefined
  let fileBase64:   string | undefined
  let fileMimeType: string | undefined
  let fileName:     string | undefined
  let fileIsImage:  boolean
  let files:        Array<{ base64: string; mimeType: string; name: string; isImage: boolean }>
  let conversationHistory: Array<{ user: string; marcus: string }>
  let approved: boolean
  let previousPlan: ExecutionPlan | undefined
  let previousRouting: RoutingResult | undefined
  let sessionId: string | undefined
  try {
    const body = await request.json() as {
      message?: string
      ventureId?: string
      ventureName?: string
      ventureSlug?: string
      repoMode?: 'github' | 'local'
      localRepoPath?: string
      githubContext?: string
      files?: Array<{ base64: string; mimeType: string; name: string; isImage: boolean }>
      // legacy single-file compat
      fileBase64?: string
      fileMimeType?: string
      fileName?: string
      fileIsImage?: boolean
      imageBase64?: string
      imageMimeType?: string
      conversationHistory?: Array<{ user: string; marcus: string }>
      approved?: boolean
      previousPlan?: ExecutionPlan
      previousRouting?: RoutingResult
      sessionId?: string
    }
    message             = body.message ?? ''
    ventureName         = body.ventureName ?? 'Novizio'
    ventureSlug         = body.ventureSlug
    repoMode            = body.repoMode ?? 'github'
    localRepoPath       = body.localRepoPath
    githubContext       = body.githubContext
    conversationHistory = body.conversationHistory ?? []
    approved            = body.approved ?? false
    previousPlan        = body.previousPlan
    previousRouting     = body.previousRouting
    sessionId           = body.sessionId
    // Multi-file: body.files takes priority; fall back to legacy single-file fields
    const legacyBase64   = body.fileBase64 ?? body.imageBase64
    const legacyMime     = body.fileMimeType ?? body.imageMimeType
    const legacyName     = body.fileName
    const legacyIsImage  = body.fileIsImage ?? (legacyMime?.startsWith('image/') ?? false)
    files = body.files ??
      (legacyBase64
        ? [{ base64: legacyBase64, mimeType: legacyMime ?? 'application/octet-stream', name: legacyName ?? 'file', isImage: legacyIsImage }]
        : [])
    // Legacy compat aliases — downstream single-file code paths still work
    fileBase64   = files[0]?.base64
    fileMimeType = files[0]?.mimeType
    fileName     = files[0]?.name
    fileIsImage  = files[0]?.isImage ?? false
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
      let controllerClosed = false
      function closeController() {
        if (!controllerClosed) { controllerClosed = true; controller.close() }
      }
      function emit(type: string, data: Record<string, unknown>) {
        if (controllerClosed) return
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
          const directFileNote = buildFilesNote(files, 'specialist')

          const directBasePrompt = `You are Marcus, CEO of YVON (venture: ${ventureName}). The user said: "${message}"${directFileNote}${directHistoryBlock}\n\nReply naturally and concisely as Marcus. No agent delegation needed.`

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
            const isDirectYvon = !ventureSlug || ventureSlug === 'yvon-dashboard'
            const directVentureScope = isDirectYvon
              ? `Active venture: YVON Dashboard. The codebase in question IS the YVON OS at the local filesystem (${YVON_OS_PATH}). Read/Bash/Glob/Grep freely explore YVON's Next.js code.`
              : `Active venture: ${ventureName} (slug: ${ventureSlug}).
⚠️ REPO SCOPE: All codebase questions about "${ventureName}" → Github(action=...) ONLY.
Read/Bash/Glob/Grep access the YVON OS (/YVON2.0/) — a completely different codebase, NOT ${ventureName}'s.
Bash git commands query YVON's git history, NOT ${ventureName}'s — never use them to answer questions about ${ventureName}.`
            const toolSystem = `You are Marcus, CEO of YVON.\n\n${directVentureScope}\n\nTools: Read/Glob/Grep/Bash(read-only)/WebFetch/Github/TodoWrite. Github supports write_file and delete_file to commit directly to the venture repo.\n⛔ No local filesystem write access. Use Github(action=write_file) to persist changes.${directSnapText ? `\n\n<github-snapshot>\n[Live GitHub data — ground truth for ${ventureName} repo]\n\n${directSnapText}\n</github-snapshot>` : ''}${directVentureDocs ? `\n\n<venture-docs>\n[Live from Supabase — source of truth for this venture]\n\n${directVentureDocs}\n</venture-docs>` : ''}\n\nThe snapshot + docs above are ground truth. Don't re-fetch what's already in them. End with a concise answer.`
            for await (const event of streamWithTools({
              agentId:     'marcus-ceo',
              ventureSlug,
              repoMode,
              localRepoPath,
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
              imageBase64: fileIsImage ? fileBase64 : undefined,
              imageMimeType: fileIsImage ? fileMimeType : undefined,
              messages: [{ role: 'user', content: directBasePrompt }],
            })) {
              directSynthesis += chunk
              emit('text', { content: chunk })
            }
          }

          const elapsed = Date.now() - startTime
          emit('plan_complete', { elapsed })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))

          if (sessionId) {
            updateWarRoomPlan(sessionId, { synthesis: directSynthesis, status: 'complete', elapsedMs: elapsed }).catch(() => {})
          } else {
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
            }).then(id => emit('session_id', { sessionId: id })).catch(() => {})
          }

          closeController()
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
          // Emit engine info in Phase 1 so the client shows engine state before approval
          const [phase1Engine, phase1Provider] = await Promise.all([getSecret('WAR_ROOM_ENGINE'), getActiveProviderInfo()])
          emit('engine', { engine: phase1Engine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: phase1Provider?.fastModel, synthesisModel: phase1Provider?.synthesisModel, provider: phase1Provider?.provider })
          emit('plan_approval_required', { plan: executionPlan, routing })
          emit('plan_complete', { elapsed: Date.now() - startTime })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat)
          closeController()
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
        {
          const [phase2Engine, phase2Provider] = await Promise.all([getSecret('WAR_ROOM_ENGINE'), getActiveProviderInfo()])
          emit('engine', { engine: phase2Engine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: phase2Provider?.fastModel, synthesisModel: phase2Provider?.synthesisModel, provider: phase2Provider?.provider })
        }

        emit('plan', { plan: executionPlan, routing })

        // ── Step 3: Specialist execution (parallel or sequential) ───────────
        const useSequential = executionPlan.order === 'sequential' && routing.specialists.length > 1
        // Build context notes for all attached files (images + text/binary docs)
        const imageNote = buildFilesNote(files, 'specialist') || undefined

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
            repoMode,
            localRepoPath,
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

              const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshotText, ventureDocsText, task, emit, githubContext, imageNote, repoMode, localRepoPath)
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
        const ceoImageNote = buildFilesNote(files, 'ceo')

        const isReportRequest = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
        const isActionRequest = !(!ventureSlug || ventureSlug === 'yvon-dashboard') && /\b(update|add|create|write|change|fix|delete|remove|rename|move|refactor|implement|replace|edit|modify|commit|push|upload|put)\b/i.test(message) && /\b(file|files|repo|code|function|class|config|dart|kt|ts|js|py|json|yaml|yml|md|flutter|android|ios|firebase|pubspec|gradle|manifest|package)\b/i.test(message)
        const ceoPrompt = isActionRequest
          ? `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists reported:
${briefingText}

User asked: ${message}${ceoImageNote}${historyBlock}

Write a concise action summary — 3–6 sentences max. Structure it exactly like this:
1. Which specialist(s) worked on this (use their names: Dev, Raj, Mia, etc.)
2. Which files were changed (exact file paths from the specialist reports)
3. The commit SHA and commit message (copy from the specialist report — do not invent)
4. Whether it succeeded or failed

⚠️ CRITICAL: You do NOT have access to Bash, Read, Glob, or Grep for ${ventureName}. Those tools are blocked — calling them will fail. Do NOT attempt git commands. All information you need is in the specialist reports above. If a commit SHA is not in the reports, say "commit SHA not reported". Write only what the specialists confirmed — no assumptions.`
          : isReportRequest
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
        const isCeoYvon = !ventureSlug || ventureSlug === 'yvon-dashboard'
        const isCeoLocal = repoMode === 'local'
        const ceoVentureScope = isCeoYvon
          ? `Active venture: YVON Dashboard. Codebase questions refer to the YVON OS local filesystem — Read/Bash/Glob/Grep are valid for this.`
          : isCeoLocal
          ? `Active venture: ${ventureName} (slug: ${ventureSlug}) — LOCAL MODE. ⚠️ Bash/Read/Glob/Grep are sandboxed to ${YVON_OS_PATH} and CANNOT access the venture repo path (${localRepoPath ?? 'not configured'}). Use Github(action=file/tree/commits/issues) for all ${ventureName} repo access.`
          : `Active venture: ${ventureName} (slug: ${ventureSlug}). ⛔ BLOCKED: Read, Bash, Glob, and Grep are NOT available to you for ${ventureName}. These tools access the YVON OS codebase — an entirely different repo. Calling them will fail with an error. For ${ventureName} repo access, use Github(action=file/tree/commits/issues) ONLY.`
        const ceoSystem = `You are Marcus, CEO of YVON synthesising specialist briefings.\n\n${ceoVentureScope}\n\nYour job: produce a single unified answer for the user. Use Github tools ONLY when a claim needs verification against the live repo. Don't call Bash, Read, Glob, or Grep for product ventures — they are blocked. The specialists already did the heavy exploration; trust their reports.${ceoSnapshotBlock}${ceoVentureDocsBlock}`

        let ceoSynthesis = ''
        const ceoMaxTokens = isReportRequest ? 4000 : 2000
        // Only stream image into synthesis if no tools needed (Anthropic tool_use API + image
        // in the same turn is finicky across the DeepSeek compat layer). If user attached an
        // image, prefer plain stream so visual analysis stays high-quality.
        const firstImage = files.find(f => f.isImage)
        if (firstImage) {
          for await (const chunk of streamSynthesis({
            maxTokens: ceoMaxTokens,
            imageBase64: firstImage.base64,
            imageMimeType: firstImage.mimeType,
            messages: [{ role: 'user', content: ceoPrompt }],
          })) {
            ceoSynthesis += chunk
            emit('text', { content: chunk })
          }
        } else {
          for await (const event of streamWithTools({
            agentId:     'marcus-ceo',
            ventureSlug,
            repoMode,
            localRepoPath,
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
        if (sessionId) {
          updateWarRoomPlan(sessionId, {
            synthesis:  ceoSynthesis || briefingText,
            status:     hasErrors ? 'partial' : 'complete',
            elapsedMs:  elapsed,
            agentsUsed: routing.specialists as AgentId[],
            steps:      stepResults,
          }).catch(err => monitoring.warn('War Room plan update failed (non-fatal)', { error: String(err) }))
        } else {
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
          }).then(id => emit('session_id', { sessionId: id }))
            .catch(err => monitoring.warn('War Room plan persistence failed (non-fatal)', { error: String(err) }))
        }

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
        closeController()
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
