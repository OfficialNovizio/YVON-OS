/**
 * app/api/team-chat/execute-stage.ts — Stage 2: Specialist Execution.
 *
 * ⚡ ROLE-AWARE: Every agent gets ONLY the context they need.
 *   ANALYZER (first seq agent): full snapshot + tools → explores, diagnoses, fixes
 *   FIXER (agents 2+): NO snapshot, exact file paths → fixes only, no exploration
 *   VALIDATOR (QA): rubric + changed files only → verifies, doesn't explore
 *
 * This dramatically reduces system prompt size (25KB → 3KB for fixers) and
 * eliminates redundant file exploration across agents.
 */

import { getAgent, AGENTS } from '@/lib/agents'
import { COLLABORATION_GRAPH, calculateRoutingConfidence, recommendCollaboration } from '@/lib/collaboration-manager'
import type { AgentId, RoutingResult, ExecutionPlan, SpecialistBriefing, WarRoomToolCall } from '@/lib/types'
import type { ModeContext } from './mode-resolver'
import {
  buildSpecialistBrief, buildAnalyzerBrief, buildFixerBrief, buildValidatorBrief,
  type RepoSnapshot, type VentureDocParts, type OsContext,
} from './brief-builder'
import { spawnHermesAgentStream, type HermesSpawnParams } from '@/lib/hermes-spawn'

/** Environment flag to switch between Hermes Agent (default) and legacy Anthropic API. */
const USE_HERMES_AGENTS = process.env.HERMES_AGENTS_ENABLED !== 'false'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepResult {
  agentId: AgentId
  taskBrief: string | null
  outputContent: string | null
  status: 'complete' | 'error' | 'retried'
  retryCount: number
  /** Tool calls made during this step — persisted for history restore. */
  toolCalls?: WarRoomToolCall[]
  /** Conversation turn (0-based) this step belongs to. Set by the route. */
  turnIndex?: number
}

type EmitFn = (type: string, data: Record<string, unknown>) => void

// ─── Hermes-powered specialist execution ───────────────────────────────────────
// Replaces the one-shot Anthropic API call with a full Hermes Agent subprocess
// that has real file tools, iterative loops, graph memory, and persistent state.

async function runSpecialistWithRetry(
  agentId: AgentId,
  params: {
    systemPrompt: string
    userPrompt: string
    ventureSlug?: string
    mode: ModeContext
    modelTier: 'fast' | 'synthesis' | 'tier1'
    maxIterations: number
    maxOutputTokens: number
    emit: EmitFn
  },
): Promise<SpecialistBriefing & { toolCalls: WarRoomToolCall[] }> {
  const MAX_ATTEMPTS = 2
  let currentPrompt = params.userPrompt
  const toolCalls: WarRoomToolCall[] = []

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      let content = ''

      if (USE_HERMES_AGENTS) {
        // ── Hermes Agent path ──────────────────────────────────────────────────
        params.emit('hermes_agent_start', { agentId, attempt })
        
        for await (const event of spawnHermesAgentStream({
          agentId,
          task: currentPrompt,
          systemContext: params.systemPrompt,
          repoMode: params.mode.isLocalMode ? 'local' : 'github',
          localRepoPath: params.mode.localRepoPath,
          ventureSlug: params.ventureSlug,
          ventureName: undefined,
          maxOutputTokens: params.maxOutputTokens,
          timeoutMs: 600_000,
        })) {
          switch (event.kind) {
            case 'agent_complete':
              content = event.fullOutput || event.previewText || ''
              break
            case 'error':
              params.emit('agent_error', { agentId, error: event.message, fatal: true })
              break
          }
        }
      }

      const contentLength = (content ?? '').trim().length

      // Empty output detection
      if (contentLength < 50 && attempt < MAX_ATTEMPTS) {
        params.emit('agent_empty_output', { agentId, attempt, contentLength })
        currentPrompt = `${currentPrompt}\n\n⚠️ Your previous response was empty or too short (${contentLength} chars). You MUST produce a substantive output — at minimum 100 words. Use your tools to gather data, then write a complete response. Do not return an empty or placeholder answer.`
        params.emit('agent_retry', { agentId, attempt, reason: `empty output (${contentLength} chars)` })
        continue
      }

      const fullText = (content ?? '').trim()
      params.emit('agent_complete', {
        agentId,
        previewText: fullText.slice(0, 200),
        fullOutput: fullText,
      })
      return { agentId, content: fullText, toolCalls }
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        params.emit('retry', { agentId, attempt })
      } else {
        params.emit('agent_error', { agentId, error: String(err), fatal: true })
        return { agentId, content: '', toolCalls }
      }
    }
  }

  return { agentId, content: '', toolCalls }
}

// ─── Main execute function ───────────────────────────────────────────────────

export interface ExecuteStageParams {
  routing: RoutingResult
  plan: ExecutionPlan
  message: string
  ventureName: string
  ventureSlug?: string
  mode: ModeContext
  snapshot: RepoSnapshot | null
  ventureDocs?: VentureDocParts
  osContext?: OsContext
  conversationHistory?: Array<{ user: string; marcus: string }>
  emit: EmitFn
  userMaxIterations?: number
  userMaxOutputTokens?: number
}

export interface ExecuteStageResult {
  briefings: SpecialistBriefing[]
  stepResults: StepResult[]
}

/**
 * Stage 2 — Execute.
 *
 * Runs each specialist from the plan. For parallel: all agents run simultaneously.
 * For sequential: agents run in order, but each gets their OWN sealed brief from
 * Marcus — no handoff summaries, no lossy compression, no context pollution.
 */
export async function runExecuteStage(params: ExecuteStageParams): Promise<ExecuteStageResult> {
  const { routing, plan, message, ventureName, ventureSlug, mode, snapshot, ventureDocs, osContext, conversationHistory, emit, userMaxIterations, userMaxOutputTokens } = params
  const teamIds = routing.specialists as AgentId[]
  const isSequential = plan.order === 'sequential' && teamIds.length > 1

  if (isSequential) {
    return runSequential(params)
  }

  return runParallel(params)
}

// ─── Parallel execution (all agents get analyzer briefs — they work independently) ──

async function runParallel(params: ExecuteStageParams): Promise<ExecuteStageResult> {
  const { routing, plan, message, ventureName, ventureSlug, mode, snapshot, ventureDocs, osContext, conversationHistory, emit, userMaxIterations, userMaxOutputTokens } = params
  const teamIds = routing.specialists as AgentId[]

  const stepResults: StepResult[] = new Array(teamIds.length)

  const briefings = await Promise.all(
    teamIds.map(async (id, idx) => {
      const agentId = id
      const agent = getAgent(agentId)

      // ⚡ Parallel agents: all get ANALYZER brief (they work independently on different aspects)
      const { systemPrompt, userPrompt, taskBrief } = await buildAnalyzerBrief({
        agentId, role: 'analyzer', plan, mode, snapshot, ventureDocs, osContext,
        message, ventureName, ventureSlug, conversationHistory,
      })

      const peerIds = teamIds.filter(s => s !== agentId)
      const peerNote = peerIds.length > 0
        ? `\n\n## PARALLEL TEAM\n${peerIds.map(p => getAgent(p)?.name ?? p).join(' and ')} ${peerIds.length === 1 ? 'is' : 'are'} working on complementary aspects. Stay focused on YOUR task.`
        : ''

      emit('autonomy', {
        agentId,
        level: COLLABORATION_GRAPH[agentId]?.autonomyLevel ?? 1,
        action: (COLLABORATION_GRAPH[agentId]?.autonomyLevel ?? 1) === 1 ? 'autonomous' : 'draft_review',
      })
      emit('agent_start', { agentId, task: taskBrief })

      const briefing = await runSpecialistWithRetry(agentId, {
        systemPrompt, userPrompt: userPrompt + peerNote, ventureSlug, mode,
        modelTier: agent?.modelTier ?? 'fast',
        maxIterations: userMaxIterations ?? 25,
        maxOutputTokens: userMaxOutputTokens ?? 8192,
        emit,
      })

      stepResults[idx] = { agentId, taskBrief, outputContent: briefing.content || null, status: briefing.content ? 'complete' : 'error', retryCount: 0, toolCalls: briefing.toolCalls }
      return briefing
    })
  )

  return { briefings, stepResults }
}

// ─── Sequential execution (role-aware: ANALYZER → FIXER(s)) ──────────────────

async function runSequential(params: ExecuteStageParams): Promise<ExecuteStageResult> {
  const { routing, plan, message, ventureName, ventureSlug, mode, snapshot, ventureDocs, osContext, conversationHistory, emit, userMaxIterations, userMaxOutputTokens } = params
  const teamIds = routing.specialists as AgentId[]

  const briefings: SpecialistBriefing[] = []
  const stepResults: StepResult[] = []
  let analyzerFiles: string[] = []  // files the analyzer identified

  for (let i = 0; i < teamIds.length; i++) {
    const agentId = teamIds[i]
    const agent = getAgent(agentId)
    const isFirst = i === 0
    const isLast = i === teamIds.length - 1

    // ⚡ ROLE-AWARE BRIEF: Analyzer (first) vs Fixer (subsequent)
    const briefParams = {
      agentId, plan, mode, snapshot, ventureDocs, osContext,
      message, ventureName, ventureSlug, conversationHistory,
      role: (isFirst ? 'analyzer' : 'fixer') as 'analyzer' | 'fixer',
      filesToFix: !isFirst && analyzerFiles.length > 0 ? analyzerFiles : undefined,
    }

    const { systemPrompt, userPrompt, taskBrief } = isFirst
      ? await buildAnalyzerBrief({ ...briefParams, role: 'analyzer' })
      : await buildFixerBrief({ ...briefParams, role: 'fixer' })

    const seqNote = isFirst
      ? ''
      : `\n\n## POSITION: Agent ${i + 1}/${teamIds.length}. Agent(s) before you completed their work. The files above are what they found. Fix them. Do not explore.`

    emit('autonomy', {
      agentId,
      level: COLLABORATION_GRAPH[agentId]?.autonomyLevel ?? 1,
      action: (COLLABORATION_GRAPH[agentId]?.autonomyLevel ?? 1) === 1 ? 'autonomous' : 'draft_review',
    })
    emit('agent_start', { agentId, task: taskBrief, role: isFirst ? 'analyzer' : 'fixer' })

    const briefing = await runSpecialistWithRetry(agentId, {
      systemPrompt, userPrompt: userPrompt + seqNote, ventureSlug, mode,
      modelTier: agent?.modelTier ?? 'fast',
      maxIterations: userMaxIterations ?? (isFirst ? 40 : 15),  // ⚡ analyzer gets more iterations, fixer gets fewer
      maxOutputTokens: userMaxOutputTokens ?? 8192,
      emit,
    })

    // Extract file paths from analyzer's output for the fixer
    if (isFirst && briefing.content) {
      const pathMatches = briefing.content.match(/(?:lib|app|src|test|components|pages|services|models|screens|widgets|Working UI)\/[^\s,;:`"')>\]]+/gi) ?? []
      analyzerFiles = [...new Set(pathMatches)].slice(0, 20)
    }

    briefings.push(briefing)
    stepResults.push({ agentId, taskBrief, outputContent: briefing.content || null, status: briefing.content ? 'complete' : 'error', retryCount: 0, toolCalls: briefing.toolCalls })
  }

  return { briefings, stepResults }
}

// ─── Collaboration recommendation (post-execute) ─────────────────────────────

export function emitCollaborationRecommendations(
  routing: RoutingResult,
  message: string,
  emit: EmitFn,
): void {
  if (routing.specialists.length > 0) {
    const primaryAgent = routing.specialists[0] as AgentId
    const currentTeam  = new Set(routing.specialists as AgentId[])
    const recommendedPartners = recommendCollaboration(primaryAgent, message)
      .filter(id => !currentTeam.has(id as AgentId))
    if (recommendedPartners.length > 0) {
      emit('collaboration', { primaryAgent, recommendedPartners, note: 'Agents can collaborate on this task' })
    }
  }
}
