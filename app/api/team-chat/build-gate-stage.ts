/**
 * app/api/team-chat/build-gate-stage.ts — compile-verification stage (D-integration).
 *
 * Flow: capture a BASELINE before agents edit → after the validate stage, re-run
 * the analyzer → any NEW error is a regression THIS run introduced → auto-fix it
 * (≤2 rounds, graph-aware) → hand Marcus a truthful verdict so he can never claim
 * "fixed" while errors remain. Local-mode only; degrades gracefully otherwise.
 */
import { runAnalyze, newErrors, formatErrors, type BuildError } from '@/lib/build-gate'
import { streamWithTools } from '@/lib/ai-client'
import { getAgent } from '@/lib/agents'
import { captureBuildLessons } from '@/lib/learning-loop'
import type { AgentId, ExecutionPlan, WarRoomToolCall } from '@/lib/types'
import type { ModeContext } from './mode-resolver'
import type { StepResult } from './execute-stage'

type EmitFn = (type: string, data: Record<string, unknown>) => void

export interface BuildGateResult {
  ran: boolean
  baselineCount: number
  totalErrors: number
  regressions: BuildError[]
  rounds: number
  verdict: string
  /** Fix-round agent activity, persisted so the cards restore from history. */
  steps: StepResult[]
}

/** Snapshot the compile errors BEFORE agents edit (so we can diff for regressions). */
export async function captureBuildBaseline(mode: ModeContext): Promise<BuildError[]> {
  if (!mode.isLocalMode || !mode.localRepoPath) return []
  try { return (await runAnalyze(mode.localRepoPath)).errors } catch { return [] }
}

export async function runBuildGateStage(params: {
  baseline: BuildError[]
  plan: ExecutionPlan
  mode: ModeContext
  ventureSlug?: string
  emit: EmitFn
  maxRounds?: number
  task?: string
}): Promise<BuildGateResult> {
  const { baseline, plan, mode, ventureSlug, emit, task } = params
  const maxRounds = params.maxRounds ?? 2
  const gateSteps: StepResult[] = []
  const skip = (verdict: string): BuildGateResult =>
    ({ ran: false, baselineCount: baseline.length, totalErrors: 0, regressions: [], rounds: 0, verdict, steps: gateSteps })

  if (!mode.isLocalMode || !mode.localRepoPath) return skip('Build gate skipped — not local mode (analyzer needs the local toolchain).')
  const repoRoot = mode.localRepoPath

  emit('phase_enter', { phase: 'build_gate', status: 'active' })
  let analysis = await runAnalyze(repoRoot)
  if (!analysis.ran) {
    emit('build_gate', { ran: false, reason: analysis.skippedReason })
    return skip(`Build gate skipped — ${analysis.skippedReason}.`)
  }
  const initialErrors = [...analysis.errors]   // snapshot for the learning loop
  let regressions = newErrors(baseline, analysis.errors)
  emit('build_gate', { ran: true, stack: analysis.stack, baselineErrors: baseline.length, totalErrors: analysis.errors.length, regressions: regressions.length, round: 0 })

  const fixAgent = ((plan.agents as AgentId[]).find(id => ['dev-lead', 'raj-backend', 'mia-frontend'].includes(id)) ?? 'dev-lead') as AgentId

  // Drive ALL compile errors to zero (capped per round), not just regressions —
  // a "fix the errors" task wants the build green, and pre-existing errors are
  // in the baseline. The baseline diff is still used to REPORT what's new.
  let rounds = 0
  while (analysis.errors.length > 0 && rounds < maxRounds) {
    rounds++
    const toFix = analysis.errors.slice(0, 15)
    const agent = getAgent(fixAgent)
    emit('agent_start', { agentId: fixAgent, task: `Fix ${analysis.errors.length} compile error(s) from build gate (round ${rounds}/${maxRounds})` })
    const sys = [
      agent?.systemPrompt ?? '',
      mode.toolGuidanceBlock,
      '⛔ BUILD-FIX TASK: The compiler reports the errors below. Fix EXACTLY these. Before you change any signature/name/location, call GraphQuery(target) to find every call site and update them all. No scope creep.',
    ].join('\n\n')
    const prompt = `⛔ FIX THESE COMPILE ERRORS (from \`flutter analyze\` — these are the ground truth, not opinions):\n\n${formatErrors(toFix)}\n\nFix each one. Read the file, apply the correct fix, write it back. Use GraphQuery(symbol) before editing any shared symbol so you update every call site. These MUST compile.`
    const toolMap = new Map<string, WarRoomToolCall>()
    let fixOutput = ''
    try {
      for await (const ev of streamWithTools({
        agentId: fixAgent, ventureSlug, repoMode: 'local', localRepoPath: repoRoot,
        // Compile fixes need multi-file reasoning — use the STRONG model, not the
        // fast tier (DeepSeek-flash flails on these; the reasoning is the bottleneck).
        modelTier: 'synthesis', system: sys, maxTokens: 8192, maxIterations: 20,
        messages: [{ role: 'user', content: prompt }],
      })) {
        if (ev.kind === 'text') fixOutput += ev.text
        else if (ev.kind === 'tool_call') {
          toolMap.set(ev.tool_use_id, { name: ev.name, input: ev.input, summary: null, isError: false })
          emit('tool_call_start', { agentId: fixAgent, tool: ev.name, input: ev.input, tool_use_id: ev.tool_use_id })
        }
        else if (ev.kind === 'tool_result') {
          const tc = toolMap.get(ev.tool_use_id)
          if (tc) { tc.summary = ev.summary; tc.isError = ev.is_error }
          emit('tool_call_result', { agentId: fixAgent, tool: ev.name, summary: ev.summary, is_error: ev.is_error, tool_use_id: ev.tool_use_id })
        }
        else if (ev.kind === 'error') emit('agent_error', { agentId: fixAgent, error: ev.message, fatal: false })
      }
    } catch (e) {
      emit('agent_error', { agentId: fixAgent, error: e instanceof Error ? e.message : String(e), fatal: false })
    }
    emit('agent_complete', { agentId: fixAgent, previewText: `Build-gate fix round ${rounds} applied` })
    gateSteps.push({
      agentId: fixAgent,
      taskBrief: `Build gate: fix ${toFix.length} compile error(s) (round ${rounds})`,
      outputContent: fixOutput || `Fixed ${toFix.length} compile error(s).`,
      status: 'retried',
      retryCount: rounds,
      toolCalls: [...toolMap.values()],
    })
    analysis = await runAnalyze(repoRoot)
    regressions = newErrors(baseline, analysis.errors)
    emit('build_gate', { ran: true, stack: analysis.stack, baselineErrors: baseline.length, totalErrors: analysis.errors.length, regressions: regressions.length, round: rounds })
  }

  // ── Learning loop: capture what was fixed / what still fails (verified facts) ─
  captureBuildLessons({ ventureSlug, agentId: fixAgent, task, before: initialErrors, after: analysis.errors })
    .then(r => { if (r.learned || r.corrections) emit('learning', { agentId: fixAgent, learned: r.learned, corrections: r.corrections }) })
    .catch(() => {})

  emit('phase_complete', { phase: 'build_gate' })
  const total = analysis.errors.length
  const verdict = total === 0
    ? `✅ BUILD VERIFIED CLEAN — \`flutter analyze\` reports 0 errors after ${rounds} fix round(s).`
    : `⛔ ${total} compile error(s) REMAIN after ${rounds} fix round(s)${regressions.length ? ` (${regressions.length} introduced by this run)` : ''} — the work is NOT safe to ship. You MUST report these exact errors and must NOT claim "fixed":\n${formatErrors(analysis.errors.slice(0, 15))}`
  return { ran: true, baselineCount: baseline.length, totalErrors: total, regressions, rounds, verdict, steps: gateSteps }
}
