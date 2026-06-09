/**
 * lib/learning-loop.ts — native learning loop (Hermes concept, in TS).
 *
 * The write side of the recall system already wired into briefs. After the build
 * gate VERIFIES an outcome, we capture what was learned so the SAME mistake isn't
 * repeated next time:
 *   - errors that got resolved → a "learned" memory ("this fix worked")
 *   - errors still failing after fix attempts → a high-importance "correction"
 *     ("this keeps breaking — watch for it")
 * Stored via saveVentureAgentMemory, which getVentureAgentMemories surfaces back
 * into the agent's next brief. Keyed (upsert) so it compounds instead of duplicating.
 *
 * Only fires on build-gate-VERIFIED facts — we never learn from unverified claims.
 */
import { saveVentureAgentMemory } from '@/lib/agent-memory'
import { errorKey, type BuildError } from '@/lib/build-gate'
import type { AgentId } from '@/lib/types'

function tagsFor(e: BuildError): string[] {
  const symbol = e.message.match(/'([^']+)'/)?.[1]            // e.g. 'shiftRepo'
  const fileStem = e.file.split('/').pop()?.replace(/\.\w+$/, '')
  return [symbol, fileStem, 'compile-error'].filter(Boolean) as string[]
}

export async function captureBuildLessons(params: {
  ventureSlug?: string
  agentId: AgentId
  task?: string
  before: BuildError[]   // errors present when the gate started (after specialists ran)
  after: BuildError[]    // errors remaining after the gate's fix rounds
  sessionId?: string
}): Promise<{ learned: number; corrections: number }> {
  const { ventureSlug, agentId, task, before, after, sessionId } = params
  if (!ventureSlug || ventureSlug === 'yvon-dashboard') return { learned: 0, corrections: 0 }

  const afterKeys = new Set(after.map(errorKey))
  const resolved = before.filter(e => !afterKeys.has(errorKey(e)))

  let learned = 0, corrections = 0
  const taskNote = task ? ` (task: ${task.slice(0, 80)})` : ''

  // What we fixed → durable "this worked" memory (capped, upserted by error).
  for (const e of resolved.slice(0, 8)) {
    try {
      await saveVentureAgentMemory(ventureSlug, agentId, {
        memoryKey: `fix:${errorKey(e)}`.slice(0, 200),
        content: `Resolved compile error in ${e.file}: "${e.message}". A fix for this was applied and verified by the analyzer${taskNote}.`,
        memoryType: 'learned',
        importance: 6,
        tags: tagsFor(e),
        sourceSessionId: sessionId,
      })
      learned++
    } catch { /* non-fatal */ }
  }

  // What still fails → high-importance correction so it surfaces prominently next time.
  for (const e of after.slice(0, 8)) {
    try {
      await saveVentureAgentMemory(ventureSlug, agentId, {
        memoryKey: `recurring:${errorKey(e)}`.slice(0, 200),
        content: `⚠️ RECURRING compile error in ${e.file}: "${e.message}". This was NOT resolved last time — investigate the root cause (check call sites with GraphQuery) before claiming a fix.`,
        memoryType: 'correction',
        importance: 8,
        tags: tagsFor(e),
        sourceSessionId: sessionId,
      })
      corrections++
    } catch { /* non-fatal */ }
  }

  return { learned, corrections }
}
