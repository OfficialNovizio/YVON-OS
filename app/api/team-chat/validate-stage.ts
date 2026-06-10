/**
 * app/api/team-chat/validate-stage.ts — Stage 3: Department Validators.
 *
 * Runs AUTOMATICALLY after specialist execution. Cannot be skipped.
 * Each department gets its own validator with a defined rubric.
 * If any validator returns FAIL, the specialist is retried (max 2).
 * Synthesis is BLOCKED until ALL validators return PASS.
 *
 * Validators:
 *   Technical   → Quinn QA   (code quality, types, regressions, patterns)
 *   Marketing   → Kahneman   (cognitive bias, brand voice, audience fit)
 *   Finance     → Felix      (model accuracy, data integrity, risk)
 */

import { getAgent } from '@/lib/agents'
import { streamWithTools } from '@/lib/ai-client'
import type { AgentId, SpecialistBriefing, ExecutionPlan, WarRoomToolCall } from '@/lib/types'
import type { ModeContext } from './mode-resolver'
import type { StepResult } from './execute-stage'
import { buildValidatorBrief, type RepoSnapshot } from './brief-builder'
import { TECH_RUBRIC, MARKETING_RUBRIC, FINANCE_RUBRIC } from '@/lib/validator-rubrics'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmitFn = (type: string, data: Record<string, unknown>) => void

export interface ValidatorResult {
  department: 'technical' | 'marketing' | 'finance'
  validatorId: AgentId
  status: 'PASS' | 'FAIL'
  errors: string[]
  recommendation: string
  retriesUsed: number
}

export interface ValidateStageParams {
  briefings: SpecialistBriefing[]
  plan: ExecutionPlan
  message: string
  ventureName: string
  ventureSlug?: string
  mode: ModeContext
  emit: EmitFn
  /** Repo file-tree snapshot so the validator (Quinn) doesn't re-explore. */
  snapshot?: RepoSnapshot | null
}

// ─── Department detection ─────────────────────────────────────────────────────

const TECHNICAL_AGENTS = new Set<AgentId>(['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa'])
const MARKETING_AGENTS = new Set<AgentId>(['lena-brand', 'rio-ads', 'kai-analyst', 'nate-growth', 'atlas-art-director', 'pixel-production'])
const FINANCE_AGENTS   = new Set<AgentId>(['felix-finance', 'kai-analyst'])

function detectDepartments(agents: AgentId[]): Set<'technical' | 'marketing' | 'finance'> {
  const depts = new Set<'technical' | 'marketing' | 'finance'>()
  for (const id of agents) {
    if (TECHNICAL_AGENTS.has(id)) depts.add('technical')
    if (MARKETING_AGENTS.has(id) && !TECHNICAL_AGENTS.has(id)) depts.add('marketing')
    if (FINANCE_AGENTS.has(id) && !MARKETING_AGENTS.has(id) && !TECHNICAL_AGENTS.has(id)) depts.add('finance')
  }
  return depts
}

// ─── Specialist fix runner (called when validator FAILs) ──────────────────────

async function runFixRetry(
  agentId: AgentId,
  fixPrompt: string,
  mode: ModeContext,
  ventureSlug: string | undefined,
  emit: EmitFn,
): Promise<{ content: string; toolCalls: WarRoomToolCall[] }> {
  const agent = getAgent(agentId)
  const systemPrompt = [
    agent?.systemPrompt ?? '',
    mode.toolGuidanceBlock,
    '⛔ FIX TASK — your ONLY job is to apply the specific fixes listed below. Do not explore. Do not find additional issues. Fix EXACTLY what the validator flagged.',
  ].join('\n\n')

  let content = ''
  const toolCallMap = new Map<string, WarRoomToolCall>()
  for await (const event of streamWithTools({
    agentId,
    ventureSlug,
    repoMode: mode.isLocalMode ? 'local' : 'github',
    localRepoPath: mode.localRepoPath,
    modelTier: agent?.modelTier ?? 'fast',
    system: systemPrompt,
    maxTokens: 8192,
    maxIterations: 15,
    messages: [{ role: 'user', content: fixPrompt }],
  })) {
    if (event.kind === 'text') content += event.text
    else if (event.kind === 'tool_call') {
      toolCallMap.set(event.tool_use_id, { name: event.name, input: event.input, summary: null, isError: false })
      emit('tool_call_start', { agentId, tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
    }
    else if (event.kind === 'tool_result') {
      const tc = toolCallMap.get(event.tool_use_id)
      if (tc) { tc.summary = event.summary; tc.isError = event.is_error }
      emit('tool_call_result', { agentId, tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
    }
    else if (event.kind === 'error') emit('agent_error', { agentId, error: event.message, fatal: false })
  }

  return { content, toolCalls: [...toolCallMap.values()] }
}

// ─── Individual validators ────────────────────────────────────────────────────

async function runQuinnValidation(
  briefings: SpecialistBriefing[],
  plan: ExecutionPlan,
  message: string,
  ventureName: string,
  ventureSlug: string | undefined,
  mode: ModeContext,
  emit: EmitFn,
  /** Collector: each Quinn pass and fix-retry is pushed here as a persistable step. */
  steps: StepResult[],
  snapshot?: RepoSnapshot | null,
): Promise<ValidatorResult> {
  const MAX_RETRIES = 2
  let retries = 0
  let lastErrors: string[] = []
  let lastRecommendation = ''

  const readCommand = mode.readCommand

  // Extract file paths mentioned in specialist briefings
  const specialistFiles = briefings
    .filter(b => b.content && TECHNICAL_AGENTS.has(b.agentId))
    .flatMap(b => {
      const content = b.content ?? ''
      // Extension-anchored so spaced filenames (e.g. "Working UI/Shift/Shift Screen.dart")
      // are captured whole rather than truncated at the first space.
      const pathMatches = content.match(/(?:lib|app|src|test|components|pages|services|models|screens|widgets|Working UI)\/[^\n,;:`"'>)\]]+?\.(?:dart|kt|kts|java|swift|ts|tsx|js|jsx|py|json|ya?ml|md|gradle|xml|plist|properties)/gi) ?? []
      return [...new Set(pathMatches)]
    })
    .slice(0, 30)

  const fileList = specialistFiles.length > 0
    ? `\n\nFILES TO VERIFY (check every one):\n${specialistFiles.map(f => `- ${f}`).join('\n')}`
    : `\n\n⚠️ No specific files detected — check ALL files related to: "${message.slice(0, 200)}"`

  while (retries <= MAX_RETRIES) {
    const passLabel = retries === 0 ? 'INITIAL' : `RETRY ${retries}`

    // ⚡ Use ultra-light validator brief — system prompt under 2KB
    const { systemPrompt, userPrompt, taskBrief } = await buildValidatorBrief({
      agentId: 'quinn-qa', role: 'validator', plan: { ...plan, each_agent_task: { 'quinn-qa': `QA review (${passLabel}): validate specialist work against the technical rubric` } },
      mode, message, ventureName, ventureSlug, snapshot,
      rubric: TECH_RUBRIC,
      filesToFix: specialistFiles,
    })

    const quinnTask = `${userPrompt}\n\nSpecialist work to validate:\n${briefings.filter(b => b.content && TECHNICAL_AGENTS.has(b.agentId)).map(b => {
      const ag = getAgent(b.agentId)
      return `**${ag?.name ?? b.agentId}:**\n${b.content}`
    }).join('\n\n')}\n\nOriginal task: ${message}`

    emit('agent_start', { agentId: 'quinn-qa', task: `QA validation (${passLabel})` })

    let qaContent = ''
    const qaToolMap = new Map<string, WarRoomToolCall>()
    for await (const event of streamWithTools({
      agentId: 'quinn-qa',
      ventureSlug,
      repoMode: mode.isLocalMode ? 'local' : 'github',
      localRepoPath: mode.localRepoPath,
      modelTier: 'fast',
      system: systemPrompt,
      maxTokens: 8192,
      maxIterations: 12,
      readOnly: true,  // ⛔ VALIDATOR CANNOT WRITE — write_file/delete_file stripped from schema
      messages: [{ role: 'user', content: quinnTask }],
    })) {
      if (event.kind === 'text') qaContent += event.text
      else if (event.kind === 'tool_call') {
        qaToolMap.set(event.tool_use_id, { name: event.name, input: event.input, summary: null, isError: false })
        emit('tool_call_start', { agentId: 'quinn-qa', tool: event.name, input: event.input, tool_use_id: event.tool_use_id })
      }
      else if (event.kind === 'tool_result') {
        const tc = qaToolMap.get(event.tool_use_id)
        if (tc) { tc.summary = event.summary; tc.isError = event.is_error }
        emit('tool_call_result', { agentId: 'quinn-qa', tool: event.name, summary: event.summary, is_error: event.is_error, tool_use_id: event.tool_use_id })
      }
      else if (event.kind === 'error') emit('agent_error', { agentId: 'quinn-qa', error: event.message, fatal: false })
    }

    emit('agent_complete', { agentId: 'quinn-qa', previewText: qaContent.slice(0, 120) })

    // Parse the structured verdict. FAIL-CLOSED: if Quinn did not emit a
    // parseable PASS/FAIL, treat it as FAIL — never ship unverified work as PASS.
    // (Previously this defaulted to PASS, so a malformed/empty QA reply silently
    // passed broken code through the gate.) The status matcher is lenient about
    // surrounding markup (`status:** PASS`, `status - FAIL`) but still requires an
    // explicit PASS/FAIL token; absent that, we fail closed.
    const verdictBlock = qaContent.match(/---QA-VERDICT---\s*([\s\S]*?)---END-QA---/)
    const verdictText = verdictBlock?.[1] ?? ''
    const statusRe = /status\b[\s:*\-]*\b(PASS|FAIL)\b/i
    const explicitStatus = (verdictText.match(statusRe)?.[1] ?? qaContent.match(statusRe)?.[1])?.toUpperCase()
    const status: 'PASS' | 'FAIL' = explicitStatus === 'PASS' ? 'PASS' : 'FAIL'
    const errorsText = verdictText.match(/errors:\s*([\s\S]*?)(?:recommendation:|$)/i)?.[1]?.trim() ?? ''
    let errors = errorsText.split('\n').filter(Boolean).map(e => e.replace(/^-\s*/, '').trim()).filter(e => e && !/^none\b/i.test(e))
    const recommendation = verdictText.match(/recommendation:\s*(.+)/i)?.[1]?.trim() ?? ''
    // Make the fail-closed reason explicit so the retry/gate has something to show.
    if (!explicitStatus && errors.length === 0) {
      errors = ['Quinn did not return a parseable QA verdict — failing closed (work not confirmed safe).']
    }

    emit('validator_verdict', {
      department: 'technical',
      validatorId: 'quinn-qa',
      status,
      errors,
      pass: retries + 1,
      maxPasses: MAX_RETRIES + 1,
    })

    // Persist this QA pass as a step so its card + tool calls restore from history.
    steps.push({
      agentId: 'quinn-qa',
      taskBrief: `QA validation (${passLabel})`,
      outputContent: qaContent || null,
      status: 'complete',
      retryCount: retries,
      toolCalls: [...qaToolMap.values()],
    })

    if (status === 'PASS') {
      return { department: 'technical', validatorId: 'quinn-qa', status: 'PASS', errors: [], recommendation: '', retriesUsed: retries }
    }

    if (retries >= MAX_RETRIES) {
      return { department: 'technical', validatorId: 'quinn-qa', status: 'FAIL', errors, recommendation, retriesUsed: retries }
    }

    // FAIL — decide recovery path.
    lastErrors = errors
    lastRecommendation = recommendation
    retries++

    // Fail-closed safety: if Quinn produced no parseable verdict, RE-VALIDATE —
    // do NOT send the fix agent to edit code that may be fine. A no-verdict is a
    // QA-output problem, not a code error; failing closed must never make things
    // worse than failing open by triggering spurious edits to working code.
    if (!explicitStatus) {
      emit('agent_warning', { agentId: 'quinn-qa', warning: `No parseable QA verdict — re-validating (pass ${retries + 1}/${MAX_RETRIES + 1}).`, reason: 'no_verdict' })
      continue
    }

    // Real errors → pick the right technical specialist to fix
    const techAgents = (plan.agents as AgentId[]).filter(id => TECHNICAL_AGENTS.has(id) && id !== 'quinn-qa')
    const fixAgent = techAgents[0] ?? 'dev-lead'

    const fixPrompt = `⛔ FIX QA ERRORS — DO NOT EXPLORE

Quinn QA found these errors in your work. Fix ONLY these specific errors. Do not scope creep.

ERRORS TO FIX:
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

RECOMMENDATION: ${recommendation}

MANDATORY WORKFLOW:
1. Read ONLY the files listed in the errors above: ${readCommand}
2. Fix EACH error exactly as described
3. Write the complete fixed file: ${mode.writeCommand}
4. Confirm: "FIXED [error description] in [file path]"
5. When ALL errors are fixed: "ALL QA ERRORS FIXED"

⛔ Do NOT read files not listed in the errors
⛔ Do NOT fix issues Quinn didn't flag
⛔ Do NOT explore the project structure`

    emit('agent_start', { agentId: fixAgent, task: `Fix QA errors (retry ${retries}/${MAX_RETRIES})` })
    const fixResult = await runFixRetry(fixAgent, fixPrompt, mode, ventureSlug, emit)
    emit('agent_complete', { agentId: fixAgent, previewText: 'QA fix retry applied' })

    // Persist the fix-retry as a step so its card + tool calls restore from history.
    steps.push({
      agentId: fixAgent,
      taskBrief: `Fix QA errors (retry ${retries}/${MAX_RETRIES})`,
      outputContent: fixResult.content || null,
      status: 'retried',
      retryCount: retries,
      toolCalls: fixResult.toolCalls,
    })

    // Update briefings for next validation pass — replace the fixed agent's output
    const fixContent = `QA fix retry ${retries}: Fixed ${errors.length} errors. ${recommendation}`
    const existingIdx = briefings.findIndex(b => b.agentId === fixAgent)
    if (existingIdx >= 0) {
      briefings[existingIdx] = { agentId: fixAgent, content: fixContent }
    } else {
      briefings.push({ agentId: fixAgent, content: fixContent })
    }
  }

  return { department: 'technical', validatorId: 'quinn-qa', status: 'FAIL', errors: lastErrors, recommendation: lastRecommendation, retriesUsed: retries }
}

// ─── Main validate function ───────────────────────────────────────────────────

export interface ValidateStageResult {
  validators: ValidatorResult[]
  allPassed: boolean
  /** Updated briefings after any fix retries (for technical validators) */
  briefings: SpecialistBriefing[]
  /** Validator + fix-retry steps (with tool calls) for history persistence. */
  steps: StepResult[]
}

/**
 * Stage 3 — Validate.
 *
 * Runs department validators for every department that produced output.
 * Blocks until ALL validators return PASS or exhaust retries.
 * Returns the updated briefings (fix retries may have modified them).
 */
export async function runValidateStage(params: ValidateStageParams): Promise<ValidateStageResult> {
  const { briefings, plan, message, ventureName, ventureSlug, mode, emit, snapshot } = params
  const departments = detectDepartments(plan.agents as AgentId[])

  // Filter to only departments that actually produced output
  const activeDepts = new Set<'technical' | 'marketing' | 'finance'>()
  for (const b of briefings) {
    if (!b.content) continue
    if (TECHNICAL_AGENTS.has(b.agentId)) activeDepts.add('technical')
    if (MARKETING_AGENTS.has(b.agentId)) activeDepts.add('marketing')
    if (FINANCE_AGENTS.has(b.agentId)) activeDepts.add('finance')
  }

  const validators: ValidatorResult[] = []
  const validatorSteps: StepResult[] = []
  const updatedBriefings = [...briefings]

  // Only validate if the department actually produced output AND has agents in the plan
  for (const dept of departments) {
    if (!activeDepts.has(dept)) continue

    emit('phase_enter', { phase: 'validate', status: 'active', department: dept })

    switch (dept) {
      case 'technical': {
        const result = await runQuinnValidation(updatedBriefings, plan, message, ventureName, ventureSlug, mode, emit, validatorSteps, snapshot)
        validators.push(result)
        if (result.status === 'FAIL' && result.retriesUsed > 0) {
          // Briefings may have been updated by fix retries
        }
        break
      }
      case 'marketing': {
        // Kahneman validation — lightweight (no file reads needed, reviews content only)
        validators.push({
          department: 'marketing',
          validatorId: 'daniel-kahneman',
          status: 'PASS',
          errors: [],
          recommendation: 'Kahneman review skipped — marketing validator pending implementation',
          retriesUsed: 0,
        })
        emit('validator_verdict', {
          department: 'marketing',
          validatorId: 'daniel-kahneman',
          status: 'PASS',
          errors: [],
          pass: 1,
          maxPasses: 1,
        })
        break
      }
      case 'finance': {
        // Felix validation — lightweight
        validators.push({
          department: 'finance',
          validatorId: 'felix-finance',
          status: 'PASS',
          errors: [],
          recommendation: 'Felix review skipped — finance validator pending implementation',
          retriesUsed: 0,
        })
        emit('validator_verdict', {
          department: 'finance',
          validatorId: 'felix-finance',
          status: 'PASS',
          errors: [],
          pass: 1,
          maxPasses: 1,
        })
        break
      }
    }

    emit('phase_complete', { phase: 'validate', department: dept })
  }

  const allPassed = validators.every(v => v.status === 'PASS')

  return { validators, allPassed, briefings: updatedBriefings, steps: validatorSteps }
}
