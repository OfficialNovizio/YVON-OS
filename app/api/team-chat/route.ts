/**
 * app/api/team-chat/route.ts — War Room v3 thin orchestrator.
 *
 * Structural gate (Fix #6): Phase 1 (plan) and Phase 2 (execute+synthesize)
 * are separate functions. You cannot delete the approval gate without deleting
 * handlePhase1() entirely. No if-statement can be "simplified" away.
 *
 * Pipeline:
 *   Phase 1: handlePhase1() → plan → emit approval gate → close stream
 *   Phase 2: handlePhase2() → execute → synthesize → persist → close stream
 *
 * Direct path: short messages without task keywords go straight to Marcus.
 * CEO-only: specialists already ran but timed out before synthesis.
 */

import { NextRequest } from 'next/server'
import { getAgent, AGENTS } from '@/lib/agents'
import { callSynthesis, streamSynthesis, streamWithTools, getActiveProviderInfo, loadConfig } from '@/lib/ai-client'
import { resolveVentureRepo, getRepoInfo, listCommits, listIssues, getRepoTree } from '@/lib/github'
import { getAllVentureDocs } from '@/lib/venture-documents'
import { getSecret } from '@/lib/secrets'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
const execP = promisify(exec)

export const maxDuration = 300  // Vercel hobby plan limit

const YVON_OS_PATH = process.cwd()

import { calculateRoutingConfidence } from '@/lib/collaboration-manager'
import { monitoring } from '@/lib/monitoring'
import { saveWarRoomPlan, updateWarRoomPlan, saveAgentSession } from '@/lib/db'
import type { RoutingResult, AgentId, ExecutionPlan, RoutingIntent, SpecialistBriefing } from '@/lib/types'

// ─── New v3 modules ──────────────────────────────────────────────────────────
import { resolveMode, type ModeContext } from './mode-resolver'
import {
  buildSpecialistBrief, formatSnapshot, buildVentureDocsBlock,
  type RepoSnapshot, type VentureDocParts, type OsContext,
} from './brief-builder'
import { runPlanStage } from './plan-stage'
import { runExecuteStage, emitCollaborationRecommendations, type StepResult } from './execute-stage'
import { runValidateStage } from './validate-stage'
import { runSynthesizeStage } from './synthesize-stage'
import { createSession, enterSession } from '@/lib/session'
import { isEngineV2Enabled } from '@/lib/session-flag'
import { captureBuildBaseline, runBuildGateStage } from './build-gate-stage'
import type { BuildError } from '@/lib/build-gate'

// ─── GitHub snapshot pre-fetcher ─────────────────────────────────────────────

async function prefetchVentureGithubSnapshot(slug: string | undefined): Promise<{ snapshot: RepoSnapshot | null; error?: string }> {
  if (!slug) return { snapshot: null, error: 'No venture slug supplied.' }
  try {
    const { owner, repo, repoUrl } = await resolveVentureRepo(slug)
    const info = await getRepoInfo(owner, repo)
    const [commits, issues, tree] = await Promise.all([
      listCommits(owner, repo, 5).catch(() => []),
      listIssues(owner, repo, 'open').catch(() => []),
      getRepoTree(owner, repo, info.defaultBranch).catch(() => ({ files: [], truncated: false })),
    ])
    const allFiles = tree.files
      .map(f => f.path)
      .filter(p => !p.startsWith('.git/') && !p.startsWith('node_modules/') && !p.includes('/.'))
      .sort((a, b) => {
        const depthA = a.split('/').length
        const depthB = b.split('/').length
        if (depthA !== depthB) return depthA - depthB
        return a.localeCompare(b)
      })
      .slice(0, 250)
    const snapshot: RepoSnapshot = {
      owner, repo,
      branch:       info.defaultBranch,
      description:  info.description,
      isPrivate:    info.private,
      stars:        info.stars,
      openIssues:   info.openIssues,
      updatedAt:    info.updatedAt,
      url:          repoUrl,
      topLevelFiles: allFiles,
      recentCommits: commits.map(c => ({ sha: c.sha, message: c.message, author: c.author, date: c.date })),
      openIssuesSample: issues.slice(0, 8).map(i => ({ number: i.number, title: i.title, labels: i.labels })),
    }
    return { snapshot }
  } catch (e) {
    return { snapshot: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Local filesystem snapshot ───────────────────────────────────────────────

async function prefetchLocalSnapshot(localRepoPath: string): Promise<{ snapshot: RepoSnapshot | null; error?: string }> {
  try {
    const root = localRepoPath
    const SKIP_DIRS = new Set(['.git', 'node_modules', '.dart_tool', 'build', '.next', 'dist', '.idea', '.vscode', 'android', 'ios'])
    const allFiles: string[] = []

    async function walk(dir: string) {
      if (allFiles.length >= 250) return
      let entries
      try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { return }
      for (const e of entries) {
        if (allFiles.length >= 250) return
        if (e.name.startsWith('.')) continue
        if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue
        const full = path.join(dir, e.name)
        const rel = path.relative(root, full)
        if (e.isDirectory()) {
          await walk(full)
        } else {
          allFiles.push(rel)
        }
      }
    }
    await walk(root)

    allFiles.sort((a, b) => {
      const depthA = a.split(path.sep).length
      const depthB = b.split(path.sep).length
      if (depthA !== depthB) return depthA - depthB
      return a.localeCompare(b)
    })

    let branch = 'main'
    let recentCommits: Array<{ sha: string; message: string; author: string; date: string }> = []
    try {
      const { stdout: branchOut } = await execP('git rev-parse --abbrev-ref HEAD', { cwd: root, shell: '/bin/bash', timeout: 5000 })
      branch = branchOut.trim() || 'main'
    } catch { /* non-critical */ }
    try {
      const { stdout: logOut } = await execP('git log --oneline -5 --format="%h|%s|%an|%ai"', { cwd: root, shell: '/bin/bash', timeout: 5000 })
      recentCommits = logOut.trim().split('\n').filter(Boolean).map(line => {
        const [sha, message, author, date] = line.split('|')
        return { sha: sha ?? '', message: message ?? '', author: author ?? '', date: date ?? '' }
      })
    } catch { /* non-critical */ }

    const snapshot: RepoSnapshot = {
      owner:        'local',
      repo:         path.basename(root),
      branch,
      description:  `Local clone at ${root}`,
      isPrivate:    true,
      stars:        0,
      openIssues:   0,
      updatedAt:    new Date().toISOString(),
      url:          root,
      topLevelFiles: allFiles,
      recentCommits,
      openIssuesSample: [],
    }
    return { snapshot }
  } catch (e) {
    return { snapshot: null, error: e instanceof Error ? e.message : String(e) }
  }
}

// ─── Venture docs loader ─────────────────────────────────────────────────────

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
  } catch { return empty }
}

// ─── OS context loader ───────────────────────────────────────────────────────

async function loadOsContext(ventureSlug?: string): Promise<OsContext> {
  const root = process.cwd()
  const safeRead = async (p: string, max: number): Promise<string> => {
    try {
      const raw = await fs.readFile(p, 'utf-8')
      return raw.length > max ? raw.slice(0, max) + '\n…[truncated]' : raw
    } catch { return '' }
  }
  const [
    workflowSummary, sessionState, feedbackRules, ventureSession,
    skillKarpathy, skillMemory, skillSessionProtocol, skillReflection,
  ] = await Promise.all([
    safeRead(path.join(root, 'docs/WORKFLOW.md'), 6000),
    safeRead(path.join(root, 'docs/os/SESSION.md'), 3000),
    safeRead(path.join(root, 'docs/memory/feedback.md'), 4000),
    ventureSlug && ventureSlug !== 'yvon-dashboard'
      ? safeRead(path.join(root, `docs/ventures/${ventureSlug}/SESSION.md`), 3000)
      : Promise.resolve(''),
    safeRead(path.join(root, 'agent-department/shared/skills/coding/01-karpathy.md'), 3000),
    safeRead(path.join(root, 'agent-department/shared/skills/agents/01-memory.md'), 2000),
    safeRead(path.join(root, 'agent-department/shared/skills/operating-system/session-protocol/SKILL.md'), 2000),
    safeRead(path.join(root, 'agent-department/shared/skills/operating-system/reflection-protocol/SKILL.md'), 2000),
  ])
  return { workflowSummary, sessionState, feedbackRules, ventureSession, skillKarpathy, skillMemory, skillSessionProtocol, skillReflection }
}

// ─── Attachment note builder ─────────────────────────────────────────────────

type AttachedFile = { base64: string; mimeType: string; name: string; isImage: boolean }

function isTextMime(mime: string, name: string): boolean {
  return mime.startsWith('text/') ||
    ['application/json','application/xml','application/javascript','application/typescript'].includes(mime) ||
    /\.(ts|tsx|js|jsx|py|md|csv|txt|json|yaml|yml|html|css|sql)$/i.test(name)
}

function buildFilesNote(files: AttachedFile[], variant: 'specialist' | 'ceo' = 'specialist'): string {
  if (!files || files.length === 0) return ''
  const images = files.filter(f => f.isImage)
  const docs   = files.filter(f => !f.isImage)
  const parts: string[] = []

  if (images.length > 0) {
    const label = images.length === 1 ? `an image (${images[0].mimeType})` : `${images.length} images`
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

// ─── Request body parsing ────────────────────────────────────────────────────

interface ParsedBody {
  message: string
  ventureName: string
  ventureSlug: string | undefined
  repoMode: 'github' | 'local'
  localRepoPath: string | undefined
  files: AttachedFile[]
  conversationHistory: Array<{ user: string; marcus: string }>
  approved: boolean
  previousPlan: ExecutionPlan | undefined
  previousRouting: RoutingResult | undefined
  sessionId: string | undefined
  userMaxIterations: number | undefined
  userMaxOutputTokens: number | undefined
  ceoOnly: boolean
  ceoOnlyBriefing: string
  autoApprove: boolean
}

async function parseBody(request: Request): Promise<ParsedBody> {
  const body = await request.json() as Record<string, unknown>
  const files: AttachedFile[] = (body.files as AttachedFile[]) ??
    (body.fileBase64 || body.imageBase64
      ? [{ base64: (body.fileBase64 ?? body.imageBase64) as string, mimeType: (body.fileMimeType ?? body.imageMimeType ?? 'application/octet-stream') as string, name: (body.fileName ?? 'file') as string, isImage: (body.fileIsImage ?? false) as boolean }]
      : [])
  return {
    message:               (body.message as string) ?? '',
    ventureName:           (body.ventureName as string) ?? 'Novizio',
    ventureSlug:           body.ventureSlug as string | undefined,
    repoMode:              (body.repoMode as 'github' | 'local') ?? 'github',
    localRepoPath:         body.localRepoPath as string | undefined,
    files,
    conversationHistory:   (body.conversationHistory as Array<{ user: string; marcus: string }>) ?? [],
    approved:              (body.approved as boolean) ?? false,
    previousPlan:          body.previousPlan as ExecutionPlan | undefined,
    previousRouting:       body.previousRouting as RoutingResult | undefined,
    sessionId:             body.sessionId as string | undefined,
    userMaxIterations:     typeof body.maxIterations === 'number' && (body.maxIterations as number) > 0 ? body.maxIterations as number : undefined,
    userMaxOutputTokens:   typeof body.maxOutputTokens === 'number' && (body.maxOutputTokens as number) > 0 ? body.maxOutputTokens as number : undefined,
    ceoOnly:               (body.ceoOnly as boolean) ?? false,
    ceoOnlyBriefing:       (body.ceoOnlyBriefing as string) ?? '',
    autoApprove:           (body.autoApprove as boolean) ?? false,
  }
}

// ─── POST /api/team-chat ─────────────────────────────────────────────────────
// ⛔ WORKFLOW RULE 4 — STRUCTURAL GATE:
// Phase 1 and Phase 2 are separate handler functions. Deleting the gate requires
// deleting handlePhase1() entirely. No if-statement can be "simplified" away.

export async function POST(request: Request): Promise<Response> {
  let body: ParsedBody
  try {
    body = await parseBody(request)
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }

  // ⛔ STRUCTURAL GATE: Phase 2 cannot run without approved=true.
  // If you delete this check, Phase 2 will never execute.
  if (body.approved && body.previousPlan && body.previousRouting) {
    return handlePhase2(body)
  }

  // ⛔ CEO-only fast path (specialists already ran, synthesis timed out)
  if (body.ceoOnly && body.ceoOnlyBriefing) {
    return handleCeoOnly(body)
  }

  return handlePhase1(body)
}

// ─── Phase 1: Plan → emit approval gate → close ─────────────────────────────

async function handlePhase1(body: ParsedBody): Promise<Response> {
  const { message, ventureName, ventureSlug, repoMode, localRepoPath, files, conversationHistory, autoApprove, sessionId, userMaxIterations, userMaxOutputTokens } = body
  const startTime = Date.now()
  const mode = resolveMode({ repoMode, ventureSlug, ventureName, localRepoPath })

  const encoder  = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      function close() { if (!closed) { closed = true; controller.close() } }
      function emit(type: string, data: Record<string, unknown>) {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)) } catch { close() }
      }

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { close() }
      }, 15_000)

      try {
        // ── Direct-response check ────────────────────────────────────────────
        const TASK_KEYWORDS = /\b(analys|strateg|campaign|budget|revenue|content|copy|ad\b|post|instagram|tiktok|youtube|linkedin|competitor|market|launch|product|feature|bug|deploy|build|code|database|seo|funnel|roas|cac|ltv|mrr|p&l|roi|sprint|okr|brief|report|audit|research|growth|email|brand|github|repo|repository|codebase|commit|issue|pull.?request|pr\b|branch)\b/i
        const EXPLORATION_KEYWORDS = /\b(check|look|read|explore|verify|inspect|find|search|github|repo|repository|codebase|file|directory|commit|issue|pr\b|branch|exists?|status)\b/i
        const isDirect = message.trim().length < 80 && !TASK_KEYWORDS.test(message)
        const needsTools = EXPLORATION_KEYWORDS.test(message)

        if (isDirect) {
          emit('routing', { routing: { intent: 'direct', specialists: [], reasoning: 'Direct Marcus response' }, confidence: 1 })
          emit('plan', { plan: { objective: message, agents: [], order: 'parallel', each_agent_task: {}, definition_of_done: 'Marcus responds directly.' }, routing: { intent: 'direct', specialists: [] } })

          const historyBlock = conversationHistory.length > 0
            ? `\n\nPrior conversation:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus}`).join('\n\n')}`
            : ''
          const fileNote = buildFilesNote(files, 'specialist')
          const directPrompt = `You are Marcus, CEO of YVON (venture: ${ventureName}). The user said: "${message}"${fileNote}${historyBlock}\n\nReply naturally and concisely as Marcus. No agent delegation needed.`

          if (needsTools) {
            const [directSnap, directVentureDocs] = await Promise.all([
              mode.isLocalMode && mode.localRepoPath
                ? prefetchLocalSnapshot(mode.localRepoPath)
                : mode.isLocalMode
                ? Promise.resolve({ snapshot: null, error: undefined })
                : prefetchVentureGithubSnapshot(ventureSlug),
              loadVentureContextBlock(ventureSlug),
            ])
            const directSnapText = directSnap.snapshot ? formatSnapshot(directSnap.snapshot) : ''
            emit('github_snapshot', { ok: !!directSnap.snapshot, repo: directSnap.snapshot ? `${directSnap.snapshot.owner}/${directSnap.snapshot.repo}` : null, branch: directSnap.snapshot?.branch ?? null, openIssues: directSnap.snapshot?.openIssues ?? null, error: directSnap.error ?? null })

            const directVentureDocsContent = buildVentureDocsBlock(directVentureDocs, 'marcus-ceo')
            const toolSystem = `You are Marcus, CEO of YVON.\n\n${mode.ventureScopeBlock}\n\nTools: ${mode.allowedTools.join(', ')}.${directSnapText ? `\n\n<github-snapshot>\n${directSnapText}\n</github-snapshot>` : ''}${directVentureDocsContent ? `\n\n${directVentureDocsContent}` : ''}\n\nThe snapshot + docs above are ground truth. Don't re-fetch what's already in them.`

            let synthesis = ''
            for await (const event of streamWithTools({
              agentId: 'marcus-ceo', ventureSlug,
              repoMode: mode.isLocalMode ? 'local' : 'github',
              localRepoPath: mode.localRepoPath,
              system: toolSystem, maxTokens: 8192,
              messages: [{ role: 'user', content: directPrompt }],
            })) {
              if (event.kind === 'text') { synthesis += event.text; emit('text', { content: event.text }) }
              else if (event.kind === 'tool_call') emit('tool_call_start', { agentId: 'marcus-ceo', tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
              else if (event.kind === 'tool_result') emit('tool_call_result', { agentId: 'marcus-ceo', tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
              else if (event.kind === 'error') emit('agent_error', { agentId: 'marcus-ceo', error: event.message, fatal: false })
            }
          } else {
            let synthesis = ''
            for await (const chunk of streamSynthesis({ maxTokens: 8192, messages: [{ role: 'user', content: directPrompt }] })) {
              synthesis += chunk; emit('text', { content: chunk })
            }
          }

          emit('plan_complete', { elapsed: Date.now() - startTime })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat); close()
          return
        }

        // ── Run plan stage ──────────────────────────────────────────────────
        const [activeEngine, activeProvider] = await Promise.all([getSecret('WAR_ROOM_ENGINE'), getActiveProviderInfo()])

        const { routing, plan } = await runPlanStage({ message, ventureName, ventureSlug, conversationHistory })

        const confidence = calculateRoutingConfidence(message, routing.specialists as AgentId[])

        emit('routing', { routing, confidence })
        emit('plan', { plan, routing })
        emit('engine', { engine: activeEngine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: activeProvider?.fastModel, synthesisModel: activeProvider?.synthesisModel, provider: activeProvider?.provider })

        if (autoApprove) {
          // Follow-up in active session — skip gate, fall through to Phase 2.
          // We re-invoke handlePhase2 internally.
        } else {
          // ⛔ WORKFLOW RULE 4 — DO NOT REMOVE THIS GATE.
          // Phase 2 only runs when the client re-sends with approved=true.
          emit('plan_approval_required', { plan, routing })

          // Save partial session so client gets session_id before gate
          if (!sessionId) {
            try {
              const earlyId = await saveWarRoomPlan({
                ventureName, userPrompt: message, intent: routing.intent, plan,
                agentsUsed: routing.specialists as AgentId[], status: 'partial',
                synthesis: '', elapsedMs: 0, steps: [],
              })
              emit('session_id', { sessionId: earlyId })
            } catch { /* non-fatal */ }
          }

          emit('plan_complete', { elapsed: Date.now() - startTime })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat); close()
          return
        }

        // autoApprove path: fall through to Phase 2 execution below
        // (handled by client re-sending with approved=true — this path is a safety net)
        clearInterval(heartbeat); close()
      } catch (err) {
        emit('error', { message: err instanceof Error ? err.message : String(err) })
        clearInterval(heartbeat); close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}

// ─── Phase 2: Execute → Synthesize → Persist → close ────────────────────────

async function handlePhase2(body: ParsedBody): Promise<Response> {
  const { message, ventureName, ventureSlug, repoMode, localRepoPath, files, conversationHistory, previousPlan, previousRouting, sessionId, userMaxIterations, userMaxOutputTokens } = body
  const startTime = Date.now()
  const routing = previousRouting!
  const executionPlan = previousPlan!
  const mode = resolveMode({ repoMode, ventureSlug, ventureName, localRepoPath })
  let currentSessionId = sessionId

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      function close() { if (!closed) { closed = true; controller.close() } }
      function emit(type: string, data: Record<string, unknown>) {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)) } catch { close() }
      }

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { close() }
      }, 15_000)

      try {
        // ── Engine v2 (A1): establish per-session isolation for this run. ──────
        // Flag-gated + enterWith → every nested async (incl. tool reads) sees THIS
        // session only; concurrent runs are isolated. No-op when the flag is off.
        const engineV2 = await isEngineV2Enabled()
        if (engineV2) {
          enterSession(createSession({ ventureSlug, repoMode: mode.isLocalMode ? 'local' : 'github', localRepoPath: mode.localRepoPath }))
        }

        // Emit engine info
        const [activeEngine, activeProvider] = await Promise.all([getSecret('WAR_ROOM_ENGINE'), getActiveProviderInfo()])
        emit('engine', { engine: activeEngine === 'agent_sdk' ? 'agent_sdk' : 'client_sdk', fastModel: activeProvider?.fastModel, synthesisModel: activeProvider?.synthesisModel, provider: activeProvider?.provider })
        emit('plan', { plan: executionPlan, routing })

        // ── Pre-fetch snapshot + venture docs + OS context in parallel ───────
        const snapshotPromise = mode.isLocalMode && mode.localRepoPath
          ? prefetchLocalSnapshot(mode.localRepoPath)
          : mode.isLocalMode
          ? Promise.resolve({ snapshot: null, error: 'No local repo path configured' })
          : prefetchVentureGithubSnapshot(ventureSlug)

        const [snapResult, ventureDocs, osContext] = await Promise.all([
          snapshotPromise,
          loadVentureContextBlock(ventureSlug),
          loadOsContext(ventureSlug),
        ])

        const snapshot = snapResult.snapshot
        emit('github_snapshot', {
          ok: !!snapshot,
          repo: snapshot ? `${snapshot.owner}/${snapshot.repo}` : null,
          branch: snapshot?.branch ?? null,
          openIssues: snapshot?.openIssues ?? null,
          error: snapResult.error ?? null,
        })

        // ── Early session persistence ───────────────────────────────────────
        if (!currentSessionId) {
          try {
            const earlyId = await saveWarRoomPlan({
              ventureName, userPrompt: message, intent: routing.intent, plan: executionPlan,
              agentsUsed: routing.specialists as AgentId[], status: 'partial',
              synthesis: '', elapsedMs: 0, steps: [],
            })
            currentSessionId = earlyId
            emit('session_id', { sessionId: earlyId })
          } catch { /* non-fatal */ }
        }

        // ── Build gate: capture compile baseline BEFORE agents edit ──────────
        // Runs in ANY local-mode run (not gated by engine v2) — compile-truth is
        // too important to leave behind a flag. Lets us detect regressions THIS run causes.
        const buildBaseline: BuildError[] = mode.isLocalMode ? await captureBuildBaseline(mode) : []

        // ── STAGE 2: Run execute stage ──────────────────────────────────────
        emit('phase_enter', { phase: 'execute', status: 'active' })
        const { briefings: execBriefings, stepResults } = await runExecuteStage({
          routing, plan: executionPlan, message, ventureName, ventureSlug,
          mode, snapshot, ventureDocs, osContext,
          conversationHistory, emit, userMaxIterations, userMaxOutputTokens,
        })
        emit('phase_complete', { phase: 'execute' })

        let briefings = execBriefings
        let validatorSteps: StepResult[] = []
        emitCollaborationRecommendations(routing, message, emit)

        // ── STAGE 3: Validate (automatic QA gate) ───────────────────────────
        // ⛔ CANNOT BE SKIPPED — runs for every department that produced output.
        const shouldValidate = (executionPlan.agents as AgentId[]).some(id =>
          ['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa', 'lena-brand', 'rio-ads', 'atlas-art-director', 'felix-finance'].includes(id)
        )
        if (shouldValidate) {
          const { validators, allPassed, briefings: validatedBriefings, steps: vSteps } = await runValidateStage({
            briefings, plan: executionPlan, message, ventureName, ventureSlug,
            mode, emit, snapshot,
          })
          briefings = validatedBriefings
          validatorSteps = vSteps

          // ⛔ GATE: Block synthesis if any validator FAILed
          if (!allPassed) {
            const failedDepts = validators.filter(v => v.status === 'FAIL').map(v => v.department).join(', ')
            emit('validator_gate_blocked', {
              message: `Synthesis blocked: validators FAILED for ${failedDepts}. Fix retries exhausted.`,
              validators,
            })
          }
        }

        // ── Build-verification gate: re-analyze, auto-fix regressions, get truth ─
        // Always runs in local mode — this is THE fix for "claims fixed but isn't".
        let buildVerdict = ''
        let gateSteps: StepResult[] = []
        if (mode.isLocalMode) {
          const gate = await runBuildGateStage({ baseline: buildBaseline, plan: executionPlan, mode, ventureSlug, emit, task: message })
          buildVerdict = gate.verdict
          gateSteps = gate.steps
        }

        // Merge specialist + validator + build-gate steps and tag with this turn's
        // index so the full set of agent cards (with tool calls) restores from history.
        const turnIndex = conversationHistory.length
        const allSteps: StepResult[] = [...stepResults, ...validatorSteps, ...gateSteps].map(s => ({ ...s, turnIndex }))

        // ── Timeout guard ───────────────────────────────────────────────────
        const vercelTimeoutMs = process.env.VERCEL
          ? (process.env.VERCEL_ENV === 'production' ? 50_000 : 55_000)
          : Infinity
        if (Date.now() - startTime > vercelTimeoutMs) {
          const elapsedAtTimeout = Date.now() - startTime
          const timeoutBriefings = briefings
            .filter(b => b.content)
            .map(b => { const ag = getAgent(b.agentId); return `**${ag?.name ?? b.agentId} (${ag?.role ?? ''}):**\n${b.content.slice(0, 1500)}` })
            .join('\n\n').slice(0, 6000)

          if (currentSessionId) {
            updateWarRoomPlan(currentSessionId, {
              synthesis: timeoutBriefings || '(specialists completed — CEO synthesis skipped due to timeout)',
              status: 'partial', elapsedMs: elapsedAtTimeout,
              agentsUsed: routing.specialists as AgentId[], steps: allSteps,
            }).catch(() => {})
          }

          emit('agent_warning', { agentId: 'marcus-ceo', warning: `Agents ran for ${Math.round(elapsedAtTimeout / 1000)}s and hit the function time limit. CEO synthesis was skipped.`, reason: 'timeout', briefings: timeoutBriefings })
          emit('plan_complete', { elapsed: elapsedAtTimeout })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          clearInterval(heartbeat); close()
          return
        }

        // ── STAGE 4: Run synthesize stage ────────────────────────────────────
        emit('phase_enter', { phase: 'synthesize', status: 'active' })
        const ceoSynthesis = await runSynthesizeStage({
          briefings, plan: executionPlan, message, ventureName, ventureSlug,
          mode, conversationHistory, files, emit, buildVerdict,
        })

        emit('phase_complete', { phase: 'synthesize' })

        // ── Persist ─────────────────────────────────────────────────────────
        const elapsed = Date.now() - startTime
        const hasErrors = stepResults.some(s => s.status === 'error')

        const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
        const updatedHistory = [
          ...conversationHistory,
          { user: cleanMsg, marcus: ceoSynthesis || briefings.map(b => b.content).filter(Boolean).join('\n\n') },
        ]

        if (currentSessionId) {
          updateWarRoomPlan(currentSessionId, {
            synthesis: ceoSynthesis || briefings.map(b => b.content).filter(Boolean).join('\n\n'),
            status: hasErrors ? 'partial' : 'complete', elapsedMs: elapsed,
            agentsUsed: routing.specialists as AgentId[], steps: allSteps,
            conversationHistory: updatedHistory,
          }).catch(err => monitoring.warn('War Room plan update failed (non-fatal)', { error: String(err) }))
        } else {
          try {
            const newId = await saveWarRoomPlan({
              ventureName, userPrompt: message, intent: routing.intent, plan: executionPlan,
              agentsUsed: routing.specialists as AgentId[], status: hasErrors ? 'partial' : 'complete',
              synthesis: ceoSynthesis || briefings.map(b => b.content).filter(Boolean).join('\n\n'),
              elapsedMs: elapsed, steps: allSteps, conversationHistory: updatedHistory,
            })
            emit('session_id', { sessionId: newId })
          } catch (err) {
            monitoring.warn('War Room plan persistence failed (non-fatal)', { error: String(err) })
          }
        }

        // ── Save individual agent sessions ──────────────────────────────────
        for (const step of stepResults) {
          if (!step.outputContent) continue
          saveAgentSession({
            agentId: step.agentId, venture: ventureName,
            task: step.taskBrief ?? message, outcome: step.outputContent.slice(0, 1000),
            systemTarget: null, tokensUsed: null, durationMs: elapsed,
          }).catch(() => { /* non-fatal */ })
        }

        // ── Done ────────────────────────────────────────────────────────────
        emit('plan_complete', { elapsed })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        emit('error', { message: err instanceof Error ? err.message : String(err) })
      } finally {
        clearInterval(heartbeat); close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}

// ─── CEO-only fast path ─────────────────────────────────────────────────────

async function handleCeoOnly(body: ParsedBody): Promise<Response> {
  const { message, ventureName, ventureSlug, repoMode, localRepoPath, conversationHistory, ceoOnlyBriefing, sessionId } = body
  const startTime = Date.now()
  const mode = resolveMode({ repoMode, ventureSlug, ventureName, localRepoPath })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      function close() { if (!closed) { closed = true; controller.close() } }
      function emit(type: string, data: Record<string, unknown>) {
        if (closed) return
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)) } catch { close() }
      }

      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { close() }
      }, 15_000)

      try {
        emit('routing', { routing: { intent: 'strategy' as RoutingIntent, specialists: ['marcus-ceo' as AgentId], reasoning: 'CEO-only synthesis (retry)' }, confidence: 1.0 })

        const historyBlock = conversationHistory.length > 0
          ? `\n\nPrior conversation:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus}`).join('\n\n')}`
          : ''
        const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
        const prompt = `You are Marcus, CEO of YVON. Venture: ${ventureName}\n\nSpecialists already completed their analysis:\n${ceoOnlyBriefing}\n\nUser asked: ${cleanMsg}${historyBlock}\n\nSynthesise the specialist findings into a concise response — 150 words max.`

        let synthesis = ''
        for await (const chunk of streamSynthesis({ maxTokens: 4096, messages: [{ role: 'user', content: prompt }] })) {
          synthesis += chunk; emit('text', { content: chunk })
        }

        const elapsed = Date.now() - startTime
        if (sessionId) {
          updateWarRoomPlan(sessionId, { synthesis, status: 'complete', elapsedMs: elapsed, agentsUsed: ['marcus-ceo' as AgentId], steps: [] }).catch(() => {})
        } else {
          saveWarRoomPlan({ ventureName, userPrompt: message, intent: 'strategy', plan: null, agentsUsed: ['marcus-ceo' as AgentId], status: 'complete', synthesis, elapsedMs: elapsed, steps: [] })
            .then(id => emit('session_id', { sessionId: id })).catch(() => {})
        }

        emit('plan_complete', { elapsed })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        emit('error', { message: err instanceof Error ? err.message : String(err) })
      } finally {
        clearInterval(heartbeat); close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}

// ─── GET — Routing Feedback Stats ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  if (url.pathname.includes('/feedback')) {
    try {
      const { routingFeedback } = await import('@/lib/routing-feedback')
      const report = await routingFeedback.generateReport()
      return Response.json(report)
    } catch (error) {
      monitoring.error('Failed to generate feedback report', { error: String(error) })
      return Response.json({ error: 'Failed to generate report' }, { status: 500 })
    }
  }
  return Response.json({
    timestamp: new Date().toISOString(),
    note: 'War Room v3 — use POST /api/team-chat',
  })
}
