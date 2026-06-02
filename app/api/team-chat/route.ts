import { NextRequest } from 'next/server'
import { getAgent, AGENTS } from '@/lib/agents'
import { callFast, streamSynthesis, streamWithTools, getActiveProviderInfo } from '@/lib/ai-client'
import { resolveVentureRepo, getRepoInfo, listCommits, listIssues, getRepoTree } from '@/lib/github'
import { getAllVentureDocs } from '@/lib/venture-documents'
import { getAgentMemory, setAgentMemory, getVentureAgentMemories, saveVentureAgentMemory, formatVentureMemoriesBlock } from '@/lib/agent-memory'
import { VENTURE_TECH_STACK } from '@/lib/ventures'
import { getSecret } from '@/lib/secrets'
import fs from 'fs/promises'
import path from 'path'

export const maxDuration = 600

// YVON OS project root — used in agent system prompts to scope filesystem tool access.
// process.cwd() is the Next.js project root on both dev and production.
const YVON_OS_PATH = process.cwd()
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration } from '@/lib/collaboration-manager'
import { routingFeedback } from '@/lib/routing-feedback'
import { monitoring } from '@/lib/monitoring'
import { saveWarRoomPlan, updateWarRoomPlan, saveAgentSession, prefetchAgentMemory, searchSkills, trackSkillUsage } from '@/lib/db'
import type { RoutingResult, SpecialistBriefing, AgentId, ExecutionPlan, RoutingIntent } from '@/lib/types'

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

interface VentureDocParts {
  context:  string
  brand:    string
  design:   string
  feedback: string
}

async function loadVentureContextBlock(slug: string | undefined): Promise<VentureDocParts> {
  const empty: VentureDocParts = { context: '', brand: '', design: '', feedback: '' }
  if (!slug) return empty
  try {
    const cap = (text: string, max: number) => text.length > max ? text.slice(0, max) + '\n…[truncated]' : text
    const docs = await getAllVentureDocs(slug)
    return {
      context:  docs.context.content.trim()  ? `<venture-context-doc>\n${cap(docs.context.content, 4000)}\n</venture-context-doc>`   : '',
      brand:    docs.brand.content.trim()    ? `<venture-brand-doc>\n${cap(docs.brand.content, 4000)}\n</venture-brand-doc>`         : '',
      design:   docs.design.content.trim()   ? `<venture-design-doc>\n${cap(docs.design.content, 4000)}\n</venture-design-doc>`      : '',
      feedback: docs.feedback.content.trim() ? `<venture-feedback-doc>\n${cap(docs.feedback.content, 4000)}\n</venture-feedback-doc>` : '',
    }
  } catch {
    return empty
  }
}

// ─── OS Context Loader ─────────────────────────────────────────────────────────
// Reads WORKFLOW, SESSION, feedback, and venture SESSION files once per Phase 2.
// Injected ONLY into the agents Marcus selected — never all 13.

interface OsContext {
  workflowSummary: string  // docs/WORKFLOW.md (capped)
  sessionState:    string  // docs/os/SESSION.md (global rolling state)
  feedbackRules:   string  // docs/memory/feedback.md (critical never-again rules)
  ventureSession:  string  // docs/ventures/[slug]/SESSION.md
}

async function loadOsContext(ventureSlug?: string): Promise<OsContext> {
  const root = process.cwd()
  const safeRead = async (p: string, max: number): Promise<string> => {
    try {
      const raw = await fs.readFile(p, 'utf-8')
      return raw.length > max ? raw.slice(0, max) + '\n…[truncated]' : raw
    } catch { return '' }
  }
  const [workflowSummary, sessionState, feedbackRules, ventureSession] = await Promise.all([
    safeRead(path.join(root, 'docs/WORKFLOW.md'), 6000),
    safeRead(path.join(root, 'docs/os/SESSION.md'), 3000),
    safeRead(path.join(root, 'docs/memory/feedback.md'), 4000),
    ventureSlug && ventureSlug !== 'yvon-dashboard'
      ? safeRead(path.join(root, `docs/ventures/${ventureSlug}/SESSION.md`), 3000)
      : Promise.resolve(''),
  ])
  return { workflowSummary, sessionState, feedbackRules, ventureSession }
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
  advertising:         ['rio-ads', 'nate-growth'],
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
  finance:             ['felix-finance', 'marcus-ceo'],
  // Psychology Department
  behavioral_audit:    ['daniel-kahneman', 'marcus-ceo'],
}

async function classifyIntent(message: string, ventureName: string, ventureSlug?: string): Promise<RoutingResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${appUrl}/api/route-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, activeVentureName: ventureName, ventureSlug: ventureSlug ?? '' }),
  })
  if (!res.ok) throw new Error('Routing classification failed')
  return res.json() as Promise<RoutingResult>
}

// ─── Marcus Orchestration ─────────────────────────────────────────────────────
// Marcus reads the request, picks the right 2 specialists, writes their specific
// task briefs — all in one call. This is his actual CEO job: analyze → delegate → brief.
// Replaces the separate classifyIntent + buildExecutionPlan calls.

async function marcusOrchestrate(
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  conversationHistory?: Array<{ user: string; marcus: string }>,
): Promise<{ routing: RoutingResult; plan: ExecutionPlan } | null> {
  try {
    const techStack     = VENTURE_TECH_STACK[ventureSlug ?? ''] ?? 'web/mobile app'
    const isFlutter     = techStack.includes('Flutter')
    const dbTech        = techStack.includes('Firebase') ? 'Firebase' : 'Supabase'
    const frameworkTech = isFlutter ? 'Flutter/Dart' : 'Next.js/TypeScript'
    const frontendScope = isFlutter
      ? 'Flutter screens, widgets, navigation, mobile UX, Dart UI code'
      : 'React/Next.js UI components, Tailwind CSS, layout, UX'

    const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()

    const historyBlock = conversationHistory && conversationHistory.length > 0
      ? `\n\nPrior conversation (last ${Math.min(2, conversationHistory.length)} turns — use for follow-up context only):\n` +
        conversationHistory.slice(-2).map(h =>
          `User: ${h.user.slice(0, 200)}\nMarcus: ${h.marcus.slice(0, 300)}`
        ).join('\n\n')
      : ''

    const prompt =
`You are Marcus, CEO of YVON. Venture: ${ventureName} — ${techStack}${historyBlock}

User request: "${cleanMsg}"

YOUR JOB: Pick the right number of specialists for this task (2 for focused tasks, 3-4 for complex multi-domain tasks). Write each one a specific brief.

TEAM:
dev-lead          — ${frameworkTech} architecture, full-stack decisions, code review
raj-backend       — ${dbTech} APIs, database schema, server logic, auth flows
mia-frontend      — ${frontendScope}
quinn-qa          — Debugging, error diagnosis, code quality, testing
lena-brand        — Brand voice, copywriting, captions, email copy
rio-ads           — Paid ads, Meta/TikTok, ROAS, CPM, ad creative
atlas-art-director— Visual identity, art direction, creative briefs
kai-analyst       — Analytics, metrics, competitive intelligence, growth data
nate-growth       — Growth experiments, funnel strategy, acquisition
felix-finance     — P&L, CAC, LTV, MRR, runway, financial modeling
daniel-kahneman   — Cognitive bias audit, behavioral economics
diana-coo         — Operations, project plans, sprint milestones

HARD RULES:
1. Stack trace / exception in request → specialists: ["quinn-qa","dev-lead"]
2. ${dbTech} auth error / login broken → specialists: ["raj-backend","dev-lead"]
3. UI / screen / component / layout / design / styling / UX analysis or implementation → specialists: ["mia-frontend","dev-lead"]
4. Use 2 specialists for single-domain tasks. Use 3-4 only when the task genuinely spans multiple domains (e.g. backend + frontend + QA together).

INTENT OPTIONS (pick one):
strategy | operations | technical_frontend | technical_backend | technical_general | qa_review | marketing_content | social_tactics | advertising | growth_data | competitor_intel | trending_content | finance | behavioral_audit | github_analysis | product_roadmap

Return ONLY valid JSON — no markdown, no explanation. specialists array has 2 entries for focused tasks, 3-4 for multi-domain tasks:
{"intent":"<intent>","specialists":["<id1>","<id2>"],"reasoning":"<one sentence>","objective":"<clear goal>","order":"parallel","each_agent_task":{"<id1>":"<specific task for id1>","<id2>":"<specific task for id2>"},"definition_of_done":"<success criteria>"}
For 3 specialists: {"specialists":["<id1>","<id2>","<id3>"],"each_agent_task":{"<id1>":"...","<id2>":"...","<id3>":"..."},...}`

    const text = await Promise.race([
      callFast({ maxTokens: 2048, messages: [{ role: 'user', content: prompt }] }),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('orchestration_timeout')), 25000)),
    ])

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    const r = JSON.parse(match[0]) as {
      intent?:             string
      specialists?:        string[]
      reasoning?:          string
      objective?:          string
      order?:              string
      each_agent_task?:    Record<string, string>
      definition_of_done?: string
    }

    const validSpecialists = (r.specialists ?? [])
      .filter((id): id is AgentId => AGENTS.some(a => a.id === id))

    if (validSpecialists.length === 0) return null

    return {
      routing: {
        intent:      (r.intent ?? 'strategy') as RoutingIntent,
        specialists: validSpecialists,
        reasoning:   r.reasoning ?? '',
      },
      plan: {
        objective:          r.objective ?? cleanMsg.slice(0, 120),
        agents:             validSpecialists,
        order:              'parallel',
        each_agent_task:    Object.fromEntries(
          validSpecialists.map(id => [id, r.each_agent_task?.[id] ?? cleanMsg])
        ) as Partial<Record<AgentId, string>>,
        definition_of_done: r.definition_of_done ?? 'All specialists deliver their analysis and Marcus synthesizes.',
      },
    }
  } catch {
    return null
  }
}

const FALLBACK_TASK_TEMPLATES: Partial<Record<AgentId, (msg: string) => string>> = {
  'dev-lead':           msg => `Review the codebase architecture, structure, and technical health. User request: ${msg}`,
  'quinn-qa':           msg => `Audit code quality, test coverage, open issues, and flag any risks. User request: ${msg}`,
  'raj-backend':        msg => `Examine backend architecture, API routes, database schema, and server-side logic. User request: ${msg}`,
  'mia-frontend':       msg => `Review UI components, design system, and frontend structure. User request: ${msg}`,
  'marcus-ceo':         msg => `Provide executive synthesis and strategic recommendations. User request: ${msg}`,
  'diana-coo':          msg => `Assess operational processes, workflows, and execution readiness. User request: ${msg}`,
  'kai-analyst':        msg => `Analyze metrics, data signals, and surface key insights. User request: ${msg}`,
  'lena-brand':         msg => `Review brand voice, content strategy, and messaging quality. User request: ${msg}`,
  'rio-ads':            msg => `Analyze paid channel performance, ROAS, and ad strategy. User request: ${msg}`,
  'nate-growth':        msg => `Identify growth opportunities and top-of-funnel optimizations. User request: ${msg}`,
  'felix-finance':      msg => `Analyze financial metrics, P&L, and budget implications. User request: ${msg}`,
  'atlas-art-director': msg => `Review visual identity, creative direction, and brand assets. User request: ${msg}`,
  'pixel-production':   msg => `Coordinate asset production pipeline and delivery. User request: ${msg}`,
  'daniel-kahneman':    msg => `Apply behavioral psychology and cognitive bias analysis to the decision. User request: ${msg}`,
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

// ─── Task type classifier (single source of truth) ────────────────────────────
// Called once per Phase 1 and once per Phase 2 from the same cleaned message.
// Fixes C-4: previously defined twice with divergent regexes.

interface TaskClassifiers {
  isReport:          boolean
  isDebugging:       boolean
  isAction:          boolean
  isDemoData:        boolean
  isFlutterProject:  boolean
}

function classifyTask(
  cleanMessage: string,
  ventureSlug: string | undefined,
  githubSnapshot: string | undefined,
): TaskClassifiers {
  const isYvon         = !ventureSlug || ventureSlug === 'yvon-dashboard'
  const techStackStr   = VENTURE_TECH_STACK[ventureSlug ?? ''] ?? ''
  const isFlutter      = techStackStr.includes('Flutter') ||
    (!!githubSnapshot && /pubspec\.yaml/i.test(githubSnapshot)) ||
    /\b(flutter|\.dart)\b/i.test(cleanMessage)

  const isReport       = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(cleanMessage)
  const isDebugging    = !isYvon && (
    /(\bat\s+\w|\b#\d+\s+\w|Exception|Traceback|Error:|FAILED|stacktrace|\[firebase_|\[flutter_|flutter:|\bcrash\b|\bcrashed\b|\bnot\s+working\b|\bdoesn.t\s+work\b)/i.test(cleanMessage) ||
    /\b(fix\s+(this|the|my|it)|please\s+fix|help\s+me\s+fix|debug\s+(this|the|my)|resolve\s+(this|the)|i['']m\s+getting\s+(an?\s+)?error|i\s+get\s+(an?\s+)?error|getting\s+(an?\s+)?error|i\s+have\s+(an?\s+)?error|there.s\s+(an?\s+)?error)\b/i.test(cleanMessage)
  )
  const isAction       = !isYvon && !isDebugging && !isReport &&
    /\b(update|add|create|write|change|fix|delete|remove|rename|move|refactor|implement|replace|edit|modify|make|build|set\s+up|scaffold|commit|push|upload|put)\b/i.test(cleanMessage) &&
    /\b(file|files|repo|code|function|class|config|dart|kt|ts|js|py|json|yaml|yml|md|flutter|android|ios|firebase|pubspec|gradle|manifest|package|screen|page|widget|component|layout|button|ui|view|service|controller|model)\b/i.test(cleanMessage)
  const isDemoData     = isFlutter && !isDebugging && (
    /\b(demo.?data|sample.?data|mock.?data|seed.?data|dummy.?data|fake.?data)\b/i.test(cleanMessage) ||
    (/\b(demo|sample|mock|seed|dummy)\b/i.test(cleanMessage) && /\b(data|content|record|records|entries)\b/i.test(cleanMessage))
  )

  return { isReport, isDebugging, isAction, isDemoData, isFlutterProject: isFlutter }
}

const TECHNICAL_AGENTS  = new Set<AgentId>(['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa'])
const MARKETING_AGENTS  = new Set<AgentId>(['lena-brand', 'rio-ads', 'kai-analyst', 'nate-growth', 'atlas-art-director', 'pixel-production'])
const DESIGN_AGENTS     = new Set<AgentId>(['mia-frontend', 'atlas-art-director', 'pixel-production'])
const CEO_AGENTS        = new Set<AgentId>(['marcus-ceo', 'diana-coo'])

// Assemble only the venture doc sections relevant to this agent's role.
// Pass no agentId (or undefined) to get all sections — used for CEO synthesis paths.
function buildVentureDocsBlock(parts: VentureDocParts, agentId?: AgentId): string {
  const sections: string[] = []
  if (parts.context) sections.push(parts.context)
  if (!agentId || MARKETING_AGENTS.has(agentId) || CEO_AGENTS.has(agentId)) {
    if (parts.brand) sections.push(parts.brand)
  }
  // Feedback doc goes to ALL agents — contains critical never-again rules that apply
  // to technical work (wrong file patterns, bad API choices, etc.) not just brand/content.
  if (parts.feedback) sections.push(parts.feedback)
  if (!agentId || DESIGN_AGENTS.has(agentId)) {
    if (parts.design) sections.push(parts.design)
  }
  return sections.join('\n\n')
}

async function getSpecialistBriefing(
  agentId: AgentId,
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  githubSnapshot: string | undefined,
  ventureDocs: VentureDocParts | undefined,
  taskOverride: string | undefined,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
  userMaxIterations?: number,
  userMaxOutputTokens?: number,
  osContext?: OsContext,
  conversationHistory?: Array<{ user: string; marcus: string }>,
): Promise<SpecialistBriefing> {
  const agent = getAgent(agentId)
  if (!agent) return { agentId, content: '' }

  // Phase C: prefetch memory context (FTS + MEMORY.md + venture structured memories)
  // Keyword extraction: use domain-specific words (skip stop words) for better signal
  const stopWords = new Set(['the','a','an','is','it','in','on','at','to','for','of','and','or','this','that','my','we','our','can','you','me','how','what','do','be','am','are','was','were','will','with','from','by'])
  const keywords = message.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 8)
    .filter(Boolean)

  const [dbMemory, fileMemory, matchedSkills, ventureMemories] = await Promise.all([
    prefetchAgentMemory(agentId, ventureName, message),
    getAgentMemory(agentId, ventureName, 8),   // capped at 8 entries — protects context budget
    keywords.length > 0 ? searchSkills(keywords, agentId, 3) : Promise.resolve([]),
    ventureSlug && ventureSlug !== 'yvon-dashboard'
      ? getVentureAgentMemories(ventureSlug, agentId, keywords)
      : Promise.resolve([]),
  ])

  // Track usage for matched skills (fire-and-forget)
  for (const skill of matchedSkills) {
    trackSkillUsage(skill.name).catch(() => {})
  }

  const skillsBlock = matchedSkills.length > 0
    ? `<skills-context>\n[System note: Relevant skills recalled for this task — apply these patterns.]\n\n${matchedSkills.map(s => `**${s.name}**: ${s.description}`).join('\n')}\n</skills-context>`
    : ''

  const ventureMemoryBlock = formatVentureMemoriesBlock(ventureMemories)

  const memoryBlock = [
    dbMemory,
    fileMemory
      ? `<memory-context>\n[System note: Agent MEMORY.md snapshot — treat as background context, not new input.]\n\n${fileMemory}\n</memory-context>`
      : '',
    ventureMemoryBlock,
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
Local repo path: ${localRepoPath ?? '(not configured — set in Venture Settings → Profile → Local Repo Path)'}

${localRepoPath
  ? `READ PATH — use these for ALL file/code questions (preferred over GitHub):
- Read(file_path): read a file using its FULL path, e.g. Read("${localRepoPath}/lib/main.dart")
- Glob(pattern): find files within ${localRepoPath}/
- Grep(pattern): search file contents within ${localRepoPath}/
- Bash(command): shell commands, e.g. Bash("ls ${localRepoPath}") or Bash("git -C ${localRepoPath} log --oneline -5")
⚠️ Always use FULL paths when calling Read/Glob/Grep — prefix with ${localRepoPath}/
- Github(action=issues/prs): ONLY for GitHub-specific data (open issues, PRs) not in the local clone

WRITE PATH — LOCAL MODE:
- Github(action=write_file): writes directly to ${localRepoPath}/<path> on THIS machine — NOT a GitHub commit
- Github(action=delete_file): deletes from the local repo on THIS machine
- Changes appear immediately in your local clone. No git pull needed.
- ⛔ Do NOT use Github(action=tree) or Github(action=file) for reading — use Read/Bash/Glob instead`
  : `READ PATH (no local path configured — falling back to GitHub):
- Github(action=file/tree/commits/issues/prs/branches/search): reads from the GitHub repo

WRITE PATH:
- Github(action=write_file): commits to GitHub (local path not set)
- To write locally, set the path in Venture Settings → Profile → Local Repo Path.`}
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

  // Snapshot only for technical agents — marketing/finance agents don't need git history or file tree.
  const snapshotBlock = githubSnapshot && TECHNICAL_AGENTS.has(agentId)
    ? `<github-snapshot>\n[System note: Live GitHub data fetched at the start of this session — this is ground truth, use it directly.]\n\n${githubSnapshot}\n</github-snapshot>`
    : ''

  // Strip the [CONTEXT: ...] prefix injected by the War Room client before intent detection,
  // so action/debug keywords in the user’s actual message aren’t buried or missed.
  const cleanMessage = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()

  // Single source of truth — uses classifyTask() so Phase 1 and Phase 2 always agree (fix C-4)
  const { isReport, isDebugging, isAction, isDemoData, isFlutterProject } = classifyTask(
    cleanMessage,
    ventureSlug,
    githubSnapshot,
  )
  const flutterPathNote = isFlutterProject
    ? `\n\nFLUTTER PROJECT — FILE PATH RULES (MANDATORY):
- ALL .dart source files MUST be placed under \`lib/\` — NEVER at repo root
- lib/models/   — data model classes
- lib/services/demo/ — demo/seed service classes (DebtDemoService pattern)
- lib/services/ — service and provider classes
- lib/screens/  — screen widgets
- test/         — test files only
- pubspec.yaml → repo root only

⛔ NEVER create README.md files as "demo data" — create .dart files only
⛔ NEVER create .py, .sh, .rb, or ANY non-Dart file in a Flutter project
⛔ NEVER create folders at repo root for demo data — use lib/services/demo/ only
⛔ NEVER create standalone data list files in lib/data/ — use the service class pattern`
    : ''
  const ventureRepoLabel = ventureSlug ? `${ventureSlug} app repo` : 'venture app repo'
  const localWriteNote = isLocalMode && localRepoPath
    ? `✓ LOCAL MODE: Github(action=write_file) writes to your LOCAL filesystem at ${localRepoPath} — no GitHub commit. Github(action=delete_file) deletes locally too.`
    : isLocalMode
    ? `⚠️ LOCAL MODE but no local repo path configured — writes fall back to GitHub. Set the Local Repo Path in Venture Settings → Profile.`
    : `⛔ LOCAL WRITE PROHIBITION: You have zero local filesystem write access. Bash is read-only. Never claim to have written or edited a file locally. The only write path is Github(action=write_file).`
  const toolGuidance = isLocalMode && localRepoPath
    ? `<tools-available>
LOCAL MODE — ${ventureName} repo is on THIS machine at: ${localRepoPath}

READ THE LOCAL REPO (use these for ALL file/code questions — faster and more reliable than GitHub):
- Read(file_path): read a file — always use FULL path, e.g. Read("${localRepoPath}/lib/main.dart")
- Glob(pattern): find files — search within ${localRepoPath}/
- Grep(pattern): search file contents — search within ${localRepoPath}/
- Bash(command): shell commands — e.g. Bash("ls ${localRepoPath}") or Bash("git -C ${localRepoPath} log --oneline -5")
⚠️ ALWAYS prefix paths with ${localRepoPath}/ when using Read/Glob/Grep for the venture repo.
⚠️ YVON OS is a separate codebase at ${YVON_OS_PATH} — do NOT confuse the two.

WRITE TO THE LOCAL REPO:
- Github(action=write_file, path=..., content=..., message=...): writes to ${localRepoPath}/<path> directly
- Github(action=delete_file, path=..., message=...): deletes from ${localRepoPath}

GITHUB ONLY WHEN NEEDED:
- Github(action=issues/prs/commits): for GitHub-specific data not available locally
- ⛔ Do NOT use Github(action=tree) or Github(action=file) for reading — use Read/Bash/Glob instead

- WebFetch(url): fetch a URL.
- TodoWrite: plan multi-step work.

${flutterPathNote}
${isDemoData ? `Workflow: Bash("ls ${localRepoPath}/lib") → Read models → write dart files. DO NOT write README files.` : isAction ? `Read the file with Read("${localRepoPath}/...") → edit → Github(action=write_file). Confirm what was done.` : isDebugging ? `Read the error → Read("${localRepoPath}/...") the file → fix it with Github(action=write_file). 150 words max.` : isReport ? 'Produce a structured markdown report (## sections, bullet points, specific data). 300–400 words.' : 'End with a 100–150 word answer.'}
</tools-available>`
    : `<tools-available>
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
- Github(action): READ or WRITE the ${ventureName} repo.
  Read: repo · tree · file · issues · prs · branches · commits · search
  Write: write_file(path, content, message) — write a file. delete_file(path, message) — delete a file.
- TodoWrite: plan multi-step work.

${localWriteNote}${flutterPathNote}

The <github-snapshot> already has the ${ventureName} repo structure, commits, and issues — do not re-fetch those. Drill in only when you need file contents or specifics.
${isDemoData ? 'Workflow: tree → read models → write dart files. DO NOT write README files. Create .dart service files in lib/services/demo/ ONLY.' : isAction ? 'Your job is to MAKE THE CHANGE, not describe it. Read the file → edit → write_file → confirm. Do not produce a long report.' : isDebugging ? 'DIAGNOSE AND FIX — do not give a project overview. Steps: 1) identify which file the error is in, 2) read that file with Github(action=file), 3) identify the exact fix needed, 4) apply it with Github(action=write_file). End with: what was wrong + what you fixed. 150 words max.' : isReport ? 'Produce a structured markdown report (## sections, bullet points, specific data). 300–400 words.' : 'End with a 100–150 word answer.'}
</tools-available>`

  const ventureDocsContent = ventureDocs ? buildVentureDocsBlock(ventureDocs, agentId) : ''
  const ventureDocsBlock = ventureDocsContent
    ? `<venture-docs>\n[Live from Supabase venture_documents — role-relevant sections for this agent. Use as source of truth for venture identity.]\n\n${ventureDocsContent}\n</venture-docs>`
    : ''

  // OS context — injected ONLY into agents Marcus selected. Never all 13.
  // Loaded once at Phase 2 start and passed through the call chain.
  const osContextParts: string[] = []
  if (osContext?.workflowSummary) {
    osContextParts.push(`<os-workflow>\n[YVON execution protocol — you are in PERFORMING phase. Follow this model.]\n\n${osContext.workflowSummary}\n</os-workflow>`)
  }
  if (osContext?.sessionState) {
    osContextParts.push(`<os-session>\n[Global in-flight state — read for continuity across sessions.]\n\n${osContext.sessionState}\n</os-session>`)
  }
  if (osContext?.feedbackRules) {
    osContextParts.push(`<os-feedback>\n[Critical never-again rules — mandatory compliance. These override default behaviour.]\n\n${osContext.feedbackRules}\n</os-feedback>`)
  }
  if (osContext?.ventureSession && ventureName) {
    osContextParts.push(`<venture-session>\n[${ventureName} venture session state — current in-flight work and open decisions.]\n\n${osContext.ventureSession}\n</venture-session>`)
  }
  const osContextBlock = osContextParts.join('\n\n')

  const systemText = [agent.systemPrompt, memoryBlock, ghBlock, ventureBlock, ventureDocsBlock, snapshotBlock, osContextBlock, toolGuidance].filter(Boolean).join('\n\n')

  // Conversation history injection — gives specialist agents multi-turn context (fix C-2)
  const historyNote = conversationHistory && conversationHistory.length > 0
    ? `\n\n## Prior Conversation Context\n${conversationHistory.slice(-3).map(h => `**User:** ${h.user.slice(0, 300)}\n**Marcus:** ${h.marcus.slice(0, 400)}`).join('\n\n')}`
    : ''

  let content = ''
  const userPrompt = isDemoData
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}${historyNote}\n\nCREATING FLUTTER DEMO DATA — follow the EXACT existing service pattern in this project.\n\nMANDATORY WORKFLOW:\n1. Read lib/services/demo/demo_data_service.dart (shift screen demo — the primary reference pattern)\n2. Read lib/services/demo/debt_demo_service.dart (debt screen demo — second reference)\n3. Read the relevant model file in lib/models/ for the target screen\n4. Search the GetX controller for the target screen to find the exact Firebase key it uses (look for saveData or _kKey constants)\n5. Create ONE file: lib/services/demo/[screen_name]_demo_service.dart with this exact structure:\n   - Static class [ScreenName]DemoService\n   - static final _db = FirebaseDatabaseService()\n   - static const String _kKey = 'firebaseKeyHere'  ← MUST match the controller key exactly\n   - static String build[Name]Json() { ... }  ← builds JSON matching the model's fromMap() field names exactly\n   - static Future<void> seedDemo[Name]() async { await _db.saveData(_kKey, build[Name]Json()); }\n6. Write the file to lib/services/demo/[name]_demo_service.dart\n\n⛔ NEVER create files in lib/data/ — the correct path is lib/services/demo/ ONLY\n⛔ NEVER create .py, .sh, .rb, or any non-Dart file — Flutter project only\n⛔ NEVER create multiple separate data files — ONE service class file per screen\n⛔ NEVER create README.md, merge scripts, or any helper scripts\n⛔ NEVER create files at repo root\n\nEnd with: the exact file path created and the Firebase key used.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: action\nkey_output: [file path: lib/services/demo/[name]_demo_service.dart]\nconfidence: high\n---END---`
    : isAction
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}${historyNote}\n\nTake direct action — do NOT just describe what to do.\nWorkflow:\n1. If editing an existing file: read it first with Github(action=file, path=...) to get current content\n2. Make the required change\n3. Commit with Github(action=write_file, path=..., content=..., message=...)\n4. If deleting: Github(action=delete_file, path=..., message=...)\nConfirm exactly what was done: file path + commit message. Keep your reply to 3–4 sentences max.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: action\nkey_output: [file path changed]\nconfidence: high\n---END---`
    : isDebugging
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}${historyNote}\n\nThe user has a bug or error. DO NOT give a project overview or general assessment.\nDebugging workflow:\n1. Read the error message/stack trace carefully — identify the exact file and line\n2. Use Github(action=file, path=...) to read the relevant source file\n3. Identify the root cause\n4. If you can fix it: use Github(action=write_file) to commit the fix\n5. If you cannot directly fix it (config issue, Firebase console setting, etc.): give the exact step-by-step fix instruction\nResponse format: [Root cause in 1 sentence] → [Fix applied or exact steps to fix]. Max 200 words.\n\n---HANDOFF---\nsummary: [root cause in 1 sentence]\ntype: debug\nkey_output: [fix applied or fix steps]\nconfidence: high\n---END---`
    : isReport
    ? `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}${historyNote}\n\nUse tools to gather real data before writing. Produce a structured markdown report with ## section headers and bullet points. Be specific — include actual numbers, commit messages, issue titles, file names. 300–400 words.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: report\nkey_output: [deliverable]\nconfidence: high\n---END---`
    : `Venture: ${ventureName}\n\n${taskPrompt}${imageNote ?? ''}${historyNote}\n\nUse tools to explore the repo before answering. Final answer 100–150 words, specific and actionable.\n\n---HANDOFF---\nsummary: [1 sentence]\ntype: strategy\nkey_output: [deliverable]\nconfidence: high\n---END---`

  try {
    for await (const event of streamWithTools({
      agentId,
      ventureSlug,
      repoMode,
      localRepoPath,
      modelTier:     agent.modelTier,  // respect per-agent tier: tier1/synthesis/fast (fix C-1)
      system:    systemText || undefined,
      maxTokens: userMaxOutputTokens ?? 8192,
      maxIterations: userMaxIterations ?? (isDemoData ? 40 : isAction || isDebugging ? 20 : 15),
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
          if (event.reason === 'max_iterations_reached') {
            emit('agent_warning', { agentId, warning: 'Hit iteration limit — output may be incomplete. Try a more focused task.', reason: 'max_iterations' })
          }
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
  ventureDocs: VentureDocParts | undefined,
  taskOverride: string | undefined,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
  userMaxIterations?: number,
  userMaxOutputTokens?: number,
  osContext?: OsContext,
  conversationHistory?: Array<{ user: string; marcus: string }>,
): Promise<SpecialistBriefing> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const briefing = await getSpecialistBriefing(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskOverride, emit, githubContext, imageNote, repoMode, localRepoPath, userMaxIterations, userMaxOutputTokens, osContext, conversationHistory)
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
  ventureDocs: VentureDocParts | undefined,
  executionPlan: ExecutionPlan | null,
  emit: (type: string, data: Record<string, unknown>) => void,
  githubContext?: string,
  imageNote?: string,
  repoMode?: 'github' | 'local',
  localRepoPath?: string,
  userMaxIterations?: number,
  userMaxOutputTokens?: number,
  osContext?: OsContext,
  conversationHistory?: Array<{ user: string; marcus: string }>,
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

    const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshot, ventureDocs, taskWithContext, emit, githubContext, imageNote, repoMode, localRepoPath, userMaxIterations, userMaxOutputTokens, osContext, conversationHistory)
    briefings.push(briefing)
    stepResults.push({
      agentId,
      taskBrief:     task ?? null,
      outputContent: briefing.content || null,
      status:        briefing.content ? 'complete' : 'error',
      retryCount:    0,
    })

    // Accumulate handoff context — each agent sees ALL prior agents' summaries, not just the last.
    if (briefing.content && i < specialists.length - 1) {
      const nextAgentId = specialists[i + 1]
      const newSummary = createHandoffSummary(agentId, briefing.content)
      handoffContext = handoffContext ? `${handoffContext}\n\n${newSummary}` : newSummary
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
  let userMaxIterations: number | undefined
  let userMaxOutputTokens: number | undefined
  let ceoOnly: boolean
  let ceoOnlyBriefing: string
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
      maxIterations?: number
      maxOutputTokens?: number
      ceoOnly?: boolean
      ceoOnlyBriefing?: string
    }
    message               = body.message ?? ''
    ventureName           = body.ventureName ?? 'Novizio'
    ventureSlug           = body.ventureSlug
    repoMode              = body.repoMode ?? 'github'
    localRepoPath         = body.localRepoPath
    githubContext         = body.githubContext
    conversationHistory   = body.conversationHistory ?? []
    approved              = body.approved ?? false
    userMaxIterations     = typeof body.maxIterations === 'number' && body.maxIterations > 0 ? body.maxIterations : undefined
    userMaxOutputTokens   = typeof body.maxOutputTokens === 'number' && body.maxOutputTokens > 0 ? body.maxOutputTokens : undefined
    previousPlan        = body.previousPlan
    previousRouting     = body.previousRouting
    sessionId           = body.sessionId
    ceoOnly             = body.ceoOnly ?? false
    ceoOnlyBriefing     = body.ceoOnlyBriefing ?? ''
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
        // ── CEO-only synthesis fast path ──────────────────────────────────────
        // Triggered when specialists already ran but timed out before CEO synthesis.
        // Skips routing, planning, approval gate, and all specialist execution.
        // One LLM call — completes in ~5 s regardless of task complexity.
        if (ceoOnly && ceoOnlyBriefing) {
          const ceoOnlyDocs    = await loadVentureContextBlock(ventureSlug)
          const ceoOnlyDocsStr = buildVentureDocsBlock(ceoOnlyDocs)
          const ceoOnlyHistory = conversationHistory.length > 0
            ? `\n\nPrior conversation context (last 3 turns):\n${conversationHistory.slice(-3).map(h => `User: ${h.user.slice(0, 200)}\nMarcus: ${h.marcus.slice(0, 400)}${h.marcus.length > 400 ? '…' : ''}`).join('\n\n')}`
            : ''
          const ceoOnlySystem = [
            `You are Marcus, CEO of YVON synthesising specialist briefings.\n\nActive venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}.\n\nYour job: produce a single unified answer for the user from the specialist work below.`,
            ceoOnlyDocsStr ? `<venture-docs>\n[Live from Supabase — source of truth for this venture]\n\n${ceoOnlyDocsStr}\n</venture-docs>` : '',
          ].filter(Boolean).join('\n\n')
          const cleanMsgForCeo = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
          const ceoOnlyPrompt = `You are Marcus, CEO of YVON. Venture: ${ventureName}

Specialists already completed their analysis:
${ceoOnlyBriefing}

User asked: ${cleanMsgForCeo}${ceoOnlyHistory}

Synthesise the specialist findings into a concise response — 150 words max. Lead with the key insight or decision, then your recommendation.`

          emit('routing', { routing: { intent: 'strategy' as RoutingIntent, specialists: ['marcus-ceo' as AgentId], reasoning: 'CEO-only synthesis (retry)' }, confidence: 1.0 })

          let ceoOnlySynthesis = ''
          for await (const chunk of streamSynthesis({
            maxTokens: 4096,
            messages:  [{ role: 'user', content: ceoOnlyPrompt }],
          })) {
            ceoOnlySynthesis += chunk
            emit('text', { content: chunk })
          }

          const ceoOnlyElapsed = Date.now() - startTime
          if (sessionId) {
            updateWarRoomPlan(sessionId, {
              synthesis:  ceoOnlySynthesis,
              status:     'complete',
              elapsedMs:  ceoOnlyElapsed,
              agentsUsed: ['marcus-ceo' as AgentId],
              steps:      [],
            }).catch(() => {})
          } else {
            saveWarRoomPlan({
              ventureName, userPrompt: message, intent: 'strategy', plan: null,
              agentsUsed: ['marcus-ceo' as AgentId], status: 'complete',
              synthesis: ceoOnlySynthesis, elapsedMs: ceoOnlyElapsed, steps: [],
            }).then(id => emit('session_id', { sessionId: id })).catch(() => {})
          }

          emit('plan_complete', { elapsed: ceoOnlyElapsed })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          closeController()
          return
        }

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
            // Pre-fetch snapshot + venture docs in parallel so direct-Marcus has the same context.
            // Skip GitHub snapshot when in local mode — agents use the local filesystem instead.
            const [directSnap, directVentureDocs] = await Promise.all([
              repoMode === 'local' ? Promise.resolve({ snapshot: null, error: undefined }) : prefetchVentureGithubSnapshot(ventureSlug),
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
            const directVentureDocsContent = buildVentureDocsBlock(directVentureDocs)
            const toolSystem = `You are Marcus, CEO of YVON.\n\n${directVentureScope}\n\nTools: Read/Glob/Grep/Bash(read-only)/WebFetch/Github/TodoWrite. Github supports write_file and delete_file to commit directly to the venture repo.\n⛔ No local filesystem write access. Use Github(action=write_file) to persist changes.${directSnapText ? `\n\n<github-snapshot>\n[Live GitHub data — ground truth for ${ventureName} repo]\n\n${directSnapText}\n</github-snapshot>` : ''}${directVentureDocsContent ? `\n\n<venture-docs>\n[Live from Supabase — source of truth for this venture]\n\n${directVentureDocsContent}\n</venture-docs>` : ''}\n\nThe snapshot + docs above are ground truth. Don't re-fetch what's already in them. End with a concise answer.`
            for await (const event of streamWithTools({
              agentId:     'marcus-ceo',
              ventureSlug,
              repoMode,
              localRepoPath,
              system:      toolSystem,
              maxTokens:   8192,
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
              maxTokens: 8192,
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
        // Skip GitHub snapshot in local mode — the venture repo is on the local filesystem.
        const snapshotPromise = repoMode === 'local'
          ? Promise.resolve({ snapshot: null, error: undefined })
          : prefetchVentureGithubSnapshot(ventureSlug)
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

        // Hoisted once — shared between Phase 1 (emitted before gate) and Phase 2 (re-emitted after approval).
        const [activeEngine, activeProvider] = await Promise.all([getSecret('WAR_ROOM_ENGINE'), getActiveProviderInfo()])

        if (approved && previousPlan && previousRouting) {
          // Phase 2: user approved the plan — use it directly
          routing = previousRouting
          executionPlan = previousPlan
        } else {
          // Phase 1: Marcus orchestrates — analyzes request, picks team, writes briefs.
          // One LLM call instead of two. Falls back to classifier + generic plan if needed.
          const cleanMsgForPlan = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
          const orchestration = await marcusOrchestrate(message, ventureName, ventureSlug, conversationHistory)
          if (orchestration) {
            routing      = orchestration.routing
            executionPlan = orchestration.plan
          } else {
            try {
              routing = await classifyIntent(message, ventureName, ventureSlug)
              const validSpecialists = (routing.specialists ?? []).filter(
                (id) => ROUTING_INTENT_MAP[routing.intent]?.includes(id as AgentId) ||
                        AGENTS.some((a) => a.id === id)
              ) as AgentId[]
              routing.specialists = validSpecialists.length === 0
                ? (ROUTING_INTENT_MAP[routing.intent] ?? ['diana-coo', 'marcus-ceo'])
                : validSpecialists
            } catch {
              routing = {
                intent:      'strategy',
                specialists: ['marcus-ceo', 'diana-coo'],
                reasoning:   'Default routing — orchestration unavailable',
              }
            }
            executionPlan = fallbackPlan(routing.specialists as AgentId[], cleanMsgForPlan)
          }

          // Emit plan for UI, then emit approval gate — stream closes here.
          // The UI renders EngagePlanCard; on "Go ahead" the client re-calls
          // with approved=true + previousPlan + previousRouting to execute Phase 2.
          const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])
          emit('routing', { routing, confidence })
          emit('plan', { plan: executionPlan, routing })
          // Emit engine info in Phase 1 so the client shows engine state before approval
          emit('engine', { engine: activeEngine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: activeProvider?.fastModel, synthesisModel: activeProvider?.synthesisModel, provider: activeProvider?.provider })
          emit('plan_approval_required', { plan: executionPlan, routing })
          emit('plan_complete', { elapsed: Date.now() - startTime })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat)
          closeController()
          return
        }

        // Phase 2: routing was already validated and approved in Phase 1 — emit with full confidence
        emit('routing', { routing, confidence: 1.0 })

        // Load OS context once — injected into the selected agents only (not all 13).
        // Runs in parallel with snapshot + venture doc fetches.
        const [snapResult, ventureDocsText, osContext] = await Promise.all([
          snapshotPromise,
          ventureDocsPromise,
          loadOsContext(ventureSlug),
        ])
        const githubSnapshotText = snapResult.snapshot ? formatGithubSnapshot(snapResult.snapshot) : undefined
        emit('github_snapshot', {
          ok:        !!snapResult.snapshot,
          repo:      snapResult.snapshot ? `${snapResult.snapshot.owner}/${snapResult.snapshot.repo}` : null,
          branch:    snapResult.snapshot?.branch ?? null,
          openIssues: snapResult.snapshot?.openIssues ?? null,
          error:     snapResult.error ?? null,
        })

        // Engine in use — surface for diagnostic clarity
        emit('engine', { engine: activeEngine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: activeProvider?.fastModel, synthesisModel: activeProvider?.synthesisModel, provider: activeProvider?.provider })

        emit('plan', { plan: executionPlan, routing })

        // ── Early session persistence ─────────────────────────────────────────
        // Save a partial record now — before any agent work — so the client gets
        // session_id immediately. If the function times out before Step 5, the
        // DB record exists and the client can restore the thread on refresh.
        if (!sessionId) {
          try {
            const earlyId = await saveWarRoomPlan({
              ventureName,
              userPrompt:  message,
              intent:      routing.intent,
              plan:        executionPlan,
              agentsUsed:  routing.specialists as AgentId[],
              status:      'partial',
              synthesis:   '',
              elapsedMs:   0,
              steps:       [],
            })
            sessionId = earlyId
            emit('session_id', { sessionId: earlyId })
          } catch { /* non-fatal — Step 5 will retry the save */ }
        }

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
            userMaxIterations,
            userMaxOutputTokens,
            osContext,
            conversationHistory,
          )
          briefings   = result.briefings
          stepResults = result.stepResults
        } else {
          // Parallel — all specialists run simultaneously.
          // Pre-allocate by index so stepResults order matches plan order regardless of
          // which promise resolves first (fix S-2 non-deterministic ordering).
          const teamIds = routing.specialists as AgentId[]
          const parallelStepResults: StepResult[] = new Array(teamIds.length)
          briefings = await Promise.all(
            teamIds.map(async (id, idx) => {
              const agentId = id
              const task = executionPlan?.each_agent_task?.[agentId]

              // Peer awareness: tell each agent who else is working in parallel so they
              // don't duplicate reads or produce conflicting changes.
              const peerIds = teamIds.filter(s => s !== agentId)
              const peerNote = peerIds.length > 0
                ? `\n\nParallel team: ${peerIds.map(p => getAgent(p)?.name ?? p).join(' and ')} ${peerIds.length === 1 ? 'is' : 'are'} working on complementary aspects simultaneously. Stay focused on your specific assignment — avoid duplicating their scope.`
                : ''
              const taskWithPeers = task ? task + peerNote : undefined

              const autonomyLevel = COLLABORATION_GRAPH[agentId]?.autonomyLevel
              emit('autonomy', {
                agentId,
                level: autonomyLevel,
                action: autonomyLevel === 1 ? 'autonomous' : autonomyLevel === 2 ? 'draft_review' : 'consult_only',
              })
              emit('agent_start', { agentId, task: task ?? '' })

              const briefing = await getSpecialistWithRetry(agentId, message, ventureName, ventureSlug, githubSnapshotText, ventureDocsText, taskWithPeers, emit, githubContext, imageNote, repoMode, localRepoPath, userMaxIterations, userMaxOutputTokens, osContext, conversationHistory)
              // Write at fixed index — preserves plan step order regardless of async resolution
              parallelStepResults[idx] = {
                agentId,
                taskBrief:     task ?? null,
                outputContent: briefing.content || null,
                status:        briefing.content ? 'complete' : 'error',
                retryCount:    0,
              }
              return briefing
            })
          )
          stepResults = parallelStepResults
        }

        // Conflict detection skipped — saves one LLM call on local models

        // Collaboration recommendation — filter out agents already on the team (fix S-3)
        if (routing.specialists.length > 0) {
          const primaryAgent = routing.specialists[0] as AgentId
          const currentTeam  = new Set(routing.specialists as AgentId[])
          const recommendedPartners = recommendCollaboration(primaryAgent, message)
            .filter(id => !currentTeam.has(id as AgentId))
          if (recommendedPartners.length > 0) {
            emit('collaboration', { primaryAgent, recommendedPartners, note: 'Agents can collaborate on this task' })
          }
        }

        // ── Step 3.5: Quinn QA review loop ───────────────────────────────────
        // Only triggers for file-creation tasks (action/demoData/debug) when a
        // technical agent was selected but Quinn was not already in the team.
        // If Quinn finds errors the primary tech agent fixes them, then Quinn
        // re-reviews. Max 3 passes. Only the FINAL Quinn verdict reaches CEO.

        // Use unified classifier — same function as Phase 1, same result (fix C-4 + Q-6)
        const cleanMsgPhase2 = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
        const isYvonDashboardTask = !ventureSlug || ventureSlug === 'yvon-dashboard'
        const {
          isFlutterProject: isFlutterPhase2,
          isDemoData: isDemoDataPhase2,
          isAction: isActionPhase2,
          isDebugging: isDebuggingPhase2,
        } = classifyTask(cleanMsgPhase2, ventureSlug, githubSnapshotText)
        // Quinn only reviews when files are actually being created or modified.
        // Pure analysis/report tasks produce no files — Quinn's "read what specialists created" task
        // would find nothing and issue an empty PASS, wasting a full LLM call.
        const shouldRunQuinn = !isYvonDashboardTask &&
          (isActionPhase2 || isDebuggingPhase2 || isDemoDataPhase2) &&
          (routing.specialists as string[]).some(id => ['dev-lead', 'mia-frontend', 'raj-backend'].includes(id)) &&
          !(routing.specialists as string[]).includes('quinn-qa')

        if (shouldRunQuinn) {
          const MAX_QA_LOOPS = 3
          let qaLoopCount = 0
          let qaHasErrors = true
          let latestQuinnBriefing: SpecialistBriefing | null = null

          const techSpecialistsInTeam = (routing.specialists as AgentId[]).filter(id =>
            ['dev-lead', 'mia-frontend', 'raj-backend'].includes(id)
          )
          const fallbackTech = techSpecialistsInTeam[0] ?? routing.specialists[0] as AgentId

          const readInstr = repoMode === 'local' && localRepoPath
            ? `Read("${localRepoPath}/[filepath]")`
            : `Github(action=file, path=[filepath])`

          while (qaHasErrors && qaLoopCount < MAX_QA_LOOPS) {
            qaLoopCount++

            // Build review context from specialist briefings only (exclude previous Quinn passes)
            const specialistWork = briefings
              .filter(b => b.content && b.agentId !== 'quinn-qa')
              .map(b => { const ag = getAgent(b.agentId); return `**${ag?.name ?? b.agentId}:**\n${b.content}` })
              .join('\n\n')

            const quinnChecks = isFlutterPhase2 ? `\
1. Dart syntax: correct imports, valid package paths, no undefined classes or methods
2. Service file pattern: demo data MUST be a static Dart class in lib/services/demo/ matching DebtDemoService — NOT files in lib/data/, NOT .py/.sh scripts
3. Firebase keys: verify saveData() key matches the GetX controller key exactly
4. JSON/model alignment: JSON field names must match the model fromMap() parameter names exactly
5. No .py, .sh, or non-Dart files exist` : `\
1. TypeScript syntax: correct imports, valid module paths, no undefined types or missing exports
2. File location: components/pages in correct directories, follows existing project conventions
3. API alignment: function/component signatures match usage at all call sites
4. No TypeScript errors: types match, no implicit any, no missing required props
5. No accidental deletions of existing imports, exports, or required config values`

            const quinnTask = `QA REVIEW — pass ${qaLoopCount} of ${MAX_QA_LOOPS}

Read every file the specialists created or modified using ${readInstr}. Then verify:
${quinnChecks}

Specialist work:
${specialistWork}

Original task: ${message}

Return verdict in EXACTLY this format:
---QA-VERDICT---
status: PASS | FAIL
errors:
- [filepath]: [error]
recommendation: [1 sentence]
---END-QA---`

            emit('agent_start', { agentId: 'quinn-qa', task: `QA review pass ${qaLoopCount}` })
            latestQuinnBriefing = await getSpecialistWithRetry(
              'quinn-qa', message, ventureName, ventureSlug,
              githubSnapshotText, ventureDocsText,
              quinnTask, emit, githubContext, imageNote,
              repoMode, localRepoPath,
              userMaxIterations, userMaxOutputTokens, osContext, conversationHistory,
            )
            stepResults.push({ agentId: 'quinn-qa', taskBrief: quinnTask, outputContent: latestQuinnBriefing.content || null, status: latestQuinnBriefing.content ? 'complete' : 'error', retryCount: 0 })

            // Empty output → treat as PASS to avoid zombie loops
            if (!latestQuinnBriefing.content) { qaHasErrors = false; break }

            const verdictBlock = latestQuinnBriefing.content.match(/---QA-VERDICT---\s*([\s\S]*?)---END-QA---/)
            const verdictStatus = verdictBlock?.[1]?.match(/status:\s*(PASS|FAIL)/i)?.[1]?.toUpperCase() ?? 'PASS'
            const wasFail = qaHasErrors  // capture whether the PREVIOUS pass was FAIL
            qaHasErrors = verdictStatus === 'FAIL'

            // Self-learning: write correction whenever a FAIL is detected, not just terminal FAIL.
            // This captures FAIL→PASS patterns (the fix worked) AND terminal FAIL (the fix didn't).
            // Previously only wrote on terminal FAIL — missed all successful correction loops (fix C-3).
            if (verdictStatus === 'FAIL' || (wasFail && verdictStatus === 'PASS')) {
              const verdictText = verdictBlock?.[1] ?? ''
              const errorsText  = verdictText.match(/errors:\s*([\s\S]*?)(?:recommendation:|$)/i)?.[1]?.trim() ?? ''
              if (errorsText) {
                const today      = new Date().toISOString().slice(0, 10)
                const outcomeTag = verdictStatus === 'PASS' ? 'FIXED' : 'UNRESOLVED'
                const dedupeKey  = `${errorsText.slice(0, 80)}-${ventureSlug ?? ''}`
                for (const techId of techSpecialistsInTeam) {
                  try {
                    const existing = await getAgentMemory(techId, undefined, 0)
                    if (existing.includes(dedupeKey.slice(0, 60))) continue
                    const correction = `\n[${today}][venture:${ventureSlug ?? 'unknown'}][${outcomeTag}] Quinn QA: ${errorsText.slice(0, 300)}`
                    const CORRECTION_MARKER = '\n[20'
                    const baseEnd = existing.indexOf(CORRECTION_MARKER)
                    const base = baseEnd >= 0 ? existing.slice(0, baseEnd) : existing
                    const correctionEntries = baseEnd >= 0
                      ? existing.slice(baseEnd).split(CORRECTION_MARKER).filter(Boolean).map((s: string) => CORRECTION_MARKER + s)
                      : []
                    const trimmed = correctionEntries.slice(-19)
                    await setAgentMemory(techId, base + trimmed.join('') + correction)
                    // Also save to structured venture memory with high importance
                    if (ventureSlug && ventureSlug !== 'yvon-dashboard') {
                      await saveVentureAgentMemory(ventureSlug, techId, {
                        content:    `Quinn QA ${outcomeTag}: ${errorsText.slice(0, 400)}`,
                        memoryType: 'correction',
                        importance: 8,
                        tags:       ['qa', 'correction', ventureSlug],
                      })
                    }
                  } catch { /* non-fatal */ }
                }
              }
            }

            if (qaHasErrors && qaLoopCount < MAX_QA_LOOPS) {
              // Pick the fix agent by matching errored file paths against each specialist's briefing.
              // If raj-backend wrote the DB file and mia-frontend wrote the screen file, errors in
              // the screen file go to mia — not whoever was listed first.
              const errorLines = latestQuinnBriefing.content.match(/^-\s+\S[^:\n]+:/gm) ?? []
              const erroredFilenames = errorLines
                .map(l => l.replace(/^-\s+/, '').replace(/:$/, '').toLowerCase())
                .map(p => p.split('/').pop() ?? p)

              let fixAgent = fallbackTech
              if (erroredFilenames.length > 0 && techSpecialistsInTeam.length > 1) {
                let bestScore = -1
                for (const agentId of techSpecialistsInTeam) {
                  const b = briefings.find(br => br.agentId === agentId)
                  if (!b?.content) continue
                  const contentLower = b.content.toLowerCase()
                  const score = erroredFilenames.filter(f => contentLower.includes(f)).length
                  if (score > bestScore) { bestScore = score; fixAgent = agentId }
                }
              }

              const fixTask = `Quinn QA found errors. Fix ALL of them — do not stop until every issue is resolved.

Quinn's QA report:
${latestQuinnBriefing.content}

Original task: ${message}

Fix every error Quinn identified. Confirm what was changed with exact file paths.`

              emit('agent_start', { agentId: fixAgent, task: `Fix QA errors (pass ${qaLoopCount})` })
              const fixBriefing = await getSpecialistWithRetry(
                fixAgent, message, ventureName, ventureSlug,
                githubSnapshotText, ventureDocsText,
                fixTask, emit, githubContext, imageNote,
                repoMode, localRepoPath,
                userMaxIterations, userMaxOutputTokens, osContext, conversationHistory,
              )
              // Replace that specialist's briefing so next Quinn pass sees the fixed files
              briefings = briefings.filter(b => b.agentId !== fixAgent)
              briefings.push(fixBriefing)
              stepResults.push({ agentId: fixAgent, taskBrief: fixTask, outputContent: fixBriefing.content || null, status: fixBriefing.content ? 'complete' : 'error', retryCount: 0 })
            }
          }

          // Only the final Quinn verdict goes to CEO — not intermediate passes
          if (latestQuinnBriefing?.content) briefings.push(latestQuinnBriefing)
        }

        // ── Timeout guard ─────────────────────────────────────────────────────
        // Only applies on Vercel (Hobby caps at 60 s, Pro at 300 s).
        // Local dev has no timeout — guard is skipped entirely so long tasks complete.
        const vercelTimeoutMs = process.env.VERCEL
          ? (process.env.VERCEL_ENV === 'production' ? 50_000 : 55_000)
          : Infinity
        if (Date.now() - startTime > vercelTimeoutMs) {
          const elapsedAtTimeout = Date.now() - startTime
          // Build compact briefings string for CEO-only retry (capped at 6000 chars)
          const timeoutBriefings = briefings
            .filter(b => b.content)
            .map(b => { const ag = getAgent(b.agentId); return `**${ag?.name ?? b.agentId} (${ag?.role ?? ''}):**\n${b.content.slice(0, 1500)}` })
            .join('\n\n')
            .slice(0, 6000)
          // Persist briefings to DB so the session survives the timeout
          if (sessionId) {
            updateWarRoomPlan(sessionId, {
              synthesis:  timeoutBriefings || '(specialists completed — CEO synthesis skipped due to timeout)',
              status:     'partial',
              elapsedMs:  elapsedAtTimeout,
              agentsUsed: routing.specialists as AgentId[],
              steps:      stepResults,
            }).catch(() => {})
          }
          emit('agent_warning', {
            agentId:   'marcus-ceo',
            warning:   `Agents ran for ${Math.round(elapsedAtTimeout / 1000)}s and hit the function time limit. CEO synthesis was skipped — specialist work is shown above. Click Retry to get Marcus's synthesis on its own.`,
            reason:    'timeout',
            briefings: timeoutBriefings,
          })
          emit('plan_complete', { elapsed: elapsedAtTimeout })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat)
          closeController()
          return
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
          ? `\n\nPrior conversation context (last 3 turns):\n${conversationHistory.slice(-3).map(h => `User: ${h.user.slice(0, 200)}\nMarcus: ${h.marcus.slice(0, 400)}${h.marcus.length > 400 ? '…' : ''}`).join('\n\n')}`
          : ''
        const ceoImageNote = buildFilesNote(files, 'ceo')

        const isReportRequest = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
        const isActionRequest = !isReportRequest && !(!ventureSlug || ventureSlug === 'yvon-dashboard') && /\b(update|add|create|write|change|fix|delete|remove|rename|move|refactor|implement|replace|edit|modify|commit|push|upload|put)\b/i.test(message) && /\b(file|files|repo|code|function|class|config|dart|kt|ts|js|py|json|yaml|yml|md|flutter|android|ios|firebase|pubspec|gradle|manifest|package|screen|page|widget|component|layout|button|ui|view|service|controller|model)\b/i.test(message)
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

Trust the specialist reports — they already gathered the data. Write the report directly. Only call tools to fill a specific gap the specialists didn't cover.`
          : `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists delivered:
${briefingText}

User: ${message}${ceoImageNote}${historyBlock}

Synthesise the specialist findings into a concise response — 150 words max. Lead with the key insight or decision, then your recommendation.

Trust the specialist reports above — they already explored the codebase and gathered data. Write your synthesis directly. Only call tools if there is a specific factual gap the specialists did not cover and you need to resolve it.`

        const ceoSnapshotBlock = githubSnapshotText
          ? `\n\n<github-snapshot>\n[Live GitHub data — ground truth, refer to it directly]\n\n${githubSnapshotText}\n</github-snapshot>`
          : ''
        const ceoVentureDocsContent = ventureDocsText ? buildVentureDocsBlock(ventureDocsText) : ''
        const ceoVentureDocsBlock = ceoVentureDocsContent
          ? `\n\n<venture-docs>\n[Live from Supabase venture_documents — source of truth for this venture's identity, brand, design, context, feedback]\n\n${ceoVentureDocsContent}\n</venture-docs>`
          : ''
        const isCeoYvon = !ventureSlug || ventureSlug === 'yvon-dashboard'
        const isCeoLocal = repoMode === 'local'
        const ceoVentureScope = isCeoYvon
          ? `Active venture: YVON Dashboard. Codebase questions refer to the YVON OS local filesystem — Read/Bash/Glob/Grep are valid for this.`
          : isCeoLocal
          ? `Active venture: ${ventureName} (slug: ${ventureSlug}) — LOCAL MODE. ${localRepoPath ? `Read/Bash/Glob/Grep CAN access the local repo at ${localRepoPath}/ — always use FULL paths. Use Github(action=issues/prs) only for GitHub-specific data.` : `Local repo path not configured — use Github(action=file/tree/commits/issues) to read the venture repo.`}`
          : `Active venture: ${ventureName} (slug: ${ventureSlug}). ⛔ BLOCKED: Read, Bash, Glob, and Grep are NOT available to you for ${ventureName}. These tools access the YVON OS codebase — an entirely different repo. Calling them will fail with an error. For ${ventureName} repo access, use Github(action=file/tree/commits/issues) ONLY.`
        const ceoSystem = `You are Marcus, CEO of YVON synthesising specialist briefings.\n\n${ceoVentureScope}\n\nYour job: produce a single unified answer for the user.${isCeoLocal && localRepoPath ? ` In local mode, specialists used Read/Bash on the local repo — trust their reports. Verify with Read("${localRepoPath}/...") if a claim seems uncertain.` : ` Use Github tools ONLY when a claim needs verification against the live repo. Don't call Bash, Read, Glob, or Grep for product ventures — they are blocked.`} The specialists already did the heavy exploration; trust their reports.${ceoSnapshotBlock}${ceoVentureDocsBlock}`

        let ceoSynthesis = ''
        const ceoMaxTokens = 8192
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
            maxIterations: isReportRequest ? 10 : 6,
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

        // ── Step 5: Persist plan + emit session_id BEFORE closing stream ────
        // S-1 fix: previously saveWarRoomPlan().then(emit) fired after stream close.
        // Now we await it so session_id is emitted while the stream is still open.
        const elapsed    = Date.now() - startTime
        const hasErrors  = stepResults.some(s => s.status === 'error')

        if (sessionId) {
          updateWarRoomPlan(sessionId, {
            synthesis:  ceoSynthesis || briefingText,
            status:     hasErrors ? 'partial' : 'complete',
            elapsedMs:  elapsed,
            agentsUsed: routing.specialists as AgentId[],
            steps:      stepResults,
          }).catch(err => monitoring.warn('War Room plan update failed (non-fatal)', { error: String(err) }))
        } else {
          try {
            const newSessionId = await saveWarRoomPlan({
              ventureName,
              userPrompt:  message,
              intent:      routing.intent,
              plan:        executionPlan,
              agentsUsed:  routing.specialists as AgentId[],
              status:      hasErrors ? 'partial' : 'complete',
              synthesis:   ceoSynthesis || briefingText,
              elapsedMs:   elapsed,
              steps:       stepResults,
            })
            emit('session_id', { sessionId: newSessionId })
          } catch (err) {
            monitoring.warn('War Room plan persistence failed (non-fatal)', { error: String(err) })
          }
        }

        // ── Step 6: Done ─────────────────────────────────────────────────────
        emit('plan_complete', { elapsed })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))

        // Hermes Phase 1: save individual agent sessions for cross-session memory
        // Session persistence + agent self-learning (Supabase-backed)
        for (const step of stepResults) {
          if (!step.outputContent) continue

          // Save to DB (venture-scoped agent_sessions table)
          saveAgentSession({
            agentId:      step.agentId,
            venture:      ventureName,
            task:         step.taskBrief ?? message,
            outcome:      step.outputContent.slice(0, 1000),
            systemTarget: null,
            tokensUsed:   null,
            durationMs:   elapsed,
          }).catch(() => { /* non-fatal */ })

          // agent_session_memory write removed — agents don't read from that table.
          // agent_sessions (above) feeds prefetchAgentMemory FTS and is the live read path.
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
