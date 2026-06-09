/**
 * app/api/team-chat/synthesize-stage.ts — Stage 3: CEO Synthesis.
 *
 * Marcus reads specialist outputs and produces the final unified answer.
 * Streamed via SSE so the user sees Marcus's words appear in real time.
 *
 * Uses the synthesis model (Sonnet-tier) with extended thinking for
 * complex/debug tasks. Caches the system prompt for ~88% token savings
 * on repeated syntheses within the same session.
 */

import { getAgent } from '@/lib/agents'
import { streamSynthesis, streamWithTools } from '@/lib/ai-client'
import type { ExecutionPlan, SpecialistBriefing } from '@/lib/types'
import type { ModeContext } from './mode-resolver'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmitFn = (type: string, data: Record<string, unknown>) => void

// ─── Attachment note builder ──────────────────────────────────────────────────

interface AttachedFile {
  base64: string
  mimeType: string
  name: string
  isImage: boolean
}

function buildFilesNote(files: AttachedFile[], variant: 'specialist' | 'ceo' = 'ceo'): string {
  if (!files || files.length === 0) return ''
  const images = files.filter(f => f.isImage)
  const docs   = files.filter(f => !f.isImage)
  const parts: string[] = []

  if (images.length > 0) {
    const label = images.length === 1
      ? `an image (${images[0].mimeType})`
      : `${images.length} images`
    parts.push(`[The user attached ${label} — analyze visually in your synthesis.]`)
  }

  for (const file of docs) {
    if (/\.(ts|tsx|js|jsx|py|md|csv|txt|json|yaml|yml|html|css|sql)$/i.test(file.name) ||
        file.mimeType.startsWith('text/') ||
        ['application/json','application/xml','application/javascript','application/typescript'].includes(file.mimeType)) {
      try {
        const decoded = Buffer.from(file.base64, 'base64').toString('utf-8')
        parts.push(`[User attached "${file.name}"]\n<attached-file name="${file.name}">\n${decoded.slice(0, 6000)}\n</attached-file>`)
      } catch {
        parts.push(`[User attached "${file.name}" (${file.mimeType}) — could not decode.]`)
      }
    } else {
      parts.push(`[The user attached "${file.name}" (${file.mimeType}).]`)
    }
  }

  return parts.length > 0 ? '\n\n' + parts.join('\n\n') : ''
}

// ─── Main synthesis function ─────────────────────────────────────────────────

export interface SynthesizeStageParams {
  briefings: SpecialistBriefing[]
  plan: ExecutionPlan
  message: string
  ventureName: string
  ventureSlug?: string
  mode: ModeContext
  conversationHistory?: Array<{ user: string; marcus: string }>
  files?: AttachedFile[]
  emit: EmitFn
  ceoOnly?: boolean
  ceoOnlyBriefing?: string
  /** Compiler ground-truth from the build gate — overrides specialist "fixed" claims. */
  buildVerdict?: string
}

/**
 * Stage 3 — Synthesize.
 *
 * Yields text chunks via emit('text', ...) as Marcus produces his synthesis.
 * Returns the complete synthesis string.
 * Handles the CEO-only fast path when specialists timed out before synthesis.
 */
export async function runSynthesizeStage(params: SynthesizeStageParams): Promise<string> {
  const { briefings, plan, message, ventureName, ventureSlug, mode, conversationHistory, files, emit, ceoOnly, ceoOnlyBriefing, buildVerdict } = params

  // ── CEO-only fast path (specialists already ran, just need synthesis) ──────
  if (ceoOnly && ceoOnlyBriefing) {
    const historyBlock = conversationHistory && conversationHistory.length > 0
      ? `\n\nPrior conversation:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus}`).join('\n\n')}`
      : ''
    const ceoOnlyPrompt = `You are Marcus, CEO of YVON. Venture: ${ventureName}

Specialists already completed their analysis:
${ceoOnlyBriefing}

User asked: ${message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()}${historyBlock}

Synthesise the specialist findings into a concise response — 150 words max. Lead with the key insight or decision, then your recommendation.`

    let ceoOnlySynthesis = ''
    for await (const chunk of streamSynthesis({ maxTokens: 4096, messages: [{ role: 'user', content: ceoOnlyPrompt }] })) {
      ceoOnlySynthesis += chunk
      emit('text', { content: chunk })
    }
    return ceoOnlySynthesis
  }

  // ── Regular synthesis path ─────────────────────────────────────────────────

  // Build specialist context from briefings
  let briefingText = briefings
    .filter(b => b.content)
    .map(b => {
      const agent = getAgent(b.agentId)
      return `**${agent?.name ?? b.agentId} (${agent?.role ?? ''}):**\n${b.content}`
    })
    .join('\n\n')

  // Build gate is compiler ground truth — append it so it overrides any "fixed"
  // claim in the specialist briefings above, in every synthesis path.
  if (buildVerdict) {
    briefingText += `\n\n---\n## ⛔ BUILD GATE — COMPILER GROUND TRUTH (overrides specialist claims)\n${buildVerdict}\n⛔ If new compile errors remain, you MUST report them honestly and must NOT call the work fixed, done, or ship-ready.`
  }

  const fileNote = files && files.length > 0 ? buildFilesNote(files, 'ceo') : ''

  const historyBlock = conversationHistory && conversationHistory.length > 0
    ? `\n\nPrior conversation:\n${conversationHistory.map(h => `User: ${h.user}\nMarcus: ${h.marcus}`).join('\n\n')}`
    : ''

  // Determine task type for prompt selection
  const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()
  const isYvonDashboard = mode.isYvonDashboard

  const isReportRequest   = /\b(report|overview|summary|status|analysis|assessment|health|audit)\b/i.test(message)
  const isDebugRequest    = !isReportRequest && !isYvonDashboard && (
    /(\bException\b|\bError:\b|\bFAILED\b|\bstacktrace\b|\bcrash\b)/i.test(message) ||
    /\b(fix\s+(this|the|it)|solve\s+(this|it|the)|there\s+(is|are)\s+(an?\s+)?(error|issue|bug)|errors?\s+(in|with)|issues?\s+(in|with)|check\s+(errors?|issues?))\b/i.test(message)
  )
  const isActionRequest   = !isReportRequest && !isDebugRequest && !isYvonDashboard &&
    /\b(update|add|create|write|change|fix|solve|delete|remove|rename|move|refactor|implement|replace|edit|modify|commit|push|upload|put)\b/i.test(message) &&
    /\b(file|files|repo|code|function|class|config|dart|kt|ts|js|py|json|yaml|yml|md|flutter|android|ios|firebase|pubspec|gradle|manifest|package|screen|page|widget|component|layout|button|ui|view|service|controller|model)\b/i.test(message)

  // ── Option B: bounded local-mode verification ──────────────────────────────
  // When the user approved a fix in LOCAL mode, Marcus VERIFIES the specialists'
  // changes by reading the changed files (which he genuinely can in local mode)
  // before confirming — instead of being told, incorrectly, that he has no read
  // tools and then trying to read anyway and stalling. Bounded to the files the
  // specialists touched so the iteration budget is predictable.
  // Anchor on a file extension so filenames with spaces (e.g. "Working UI/Shift/
  // Shift Screen.dart" — common in this venture) are captured whole instead of
  // truncated at the first space. Non-greedy up to the extension; the negated
  // class still stops at quotes/backticks/commas so paths in prose stay bounded.
  const FILE_PATH_RE = /(?:lib|app|src|test|components|pages|services|models|screens|widgets|Working UI)\/[^\n,;:`"'>)\]]+?\.(?:dart|kt|kts|java|swift|ts|tsx|js|jsx|py|json|ya?ml|md|gradle|xml|plist|properties)/gi
  const changedFiles = [...new Set(
    briefings
      .filter(b => b.content)
      .flatMap(b => (b.content ?? '').match(FILE_PATH_RE) ?? [])
  )].slice(0, 12)
  const doLocalVerify = (isActionRequest || isDebugRequest) && mode.isLocalMode && !!mode.localRepoPath
  const changedFilesList = changedFiles.length > 0
    ? changedFiles.map(f => `- ${f}`).join('\n')
    : '(no specific file paths found in the specialist reports — verify the files they name)'
  const maxVerifyReads = Math.min(Math.max(changedFiles.length, 1), 12)

  const ceoPrompt = doLocalVerify
    ? `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists reported:
${briefingText}

User asked: ${cleanMsg}${fileNote}${historyBlock}

The specialists changed these files:
${changedFilesList}

VERIFICATION PROTOCOL — LOCAL MODE (you CAN read the repo with Read/Glob/Grep):
1. Read each changed file listed above (read at most ${maxVerifyReads} files). Use Read("${mode.localRepoPath?.replace(/\\/g, '/')}/<path>") with the FULL path. Confirm the intended change is actually present and the file is syntactically intact — no leftover/stray braces, no broken or duplicated imports, no half-applied edits.
2. Do NOT explore beyond these files. Do NOT re-read a file you already read. Go straight to Read(full path).
3. After verifying, write the fix confirmation:
   1. What was broken (1 sentence — root cause only)
   2. What was fixed — per file: the path + what changed, marked "✓ verified present" or "✗ NOT found / file broken" based on what you ACTUALLY read
   3. Status: VERIFIED FIXED / PARTIALLY FIXED / FAILED — be direct
Never say "consider", "could", "should", "recommend" — state what you verified. If a change is missing or a file is broken, say so plainly and mark it NOT FIXED.`
    : (isActionRequest || isDebugRequest)
    ? `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists reported:
${briefingText}

User asked: ${cleanMsg}${fileNote}${historyBlock}

Write a fix confirmation — NOT an analysis, NOT a recommendation, NOT "you should now do X".
The user approved this once and expects it done. Structure:
1. What was broken (1 sentence — root cause only)
2. What was fixed (exact file paths + what changed — copy from specialist reports)
3. Commit SHA if reported, or "no commit SHA in report"
4. Status: FIXED / PARTIALLY FIXED / FAILED — be direct

If specialists only analyzed but did NOT write any files: say "Specialists diagnosed but made no code changes — the bug is not yet fixed. Here is exactly what needs to change: [list the specific fixes needed with file paths]."
Never say "consider", "could", "should", "recommend" — state what happened.

⚠️ You do NOT have access to Bash, Read, Glob, or Grep for ${ventureName}. All information is in the specialist reports above.`
    : isReportRequest
    ? `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists delivered:
${briefingText}

User: ${cleanMsg}${fileNote}${historyBlock}

Produce a comprehensive executive report. Structure it as:
## Executive Summary (2–3 sentences)
## Key Findings (bullet points with specific data from specialists)
## Risks / Open Items (what needs attention)
## Recommended Next Actions (ranked by priority)

Use real data from the specialist reports. Do not hedge with "I think" — state what the data shows. 300–500 words total.

Trust the specialist reports — they already gathered the data. Write the report directly.`
    : `You are Marcus, CEO of YVON. Venture: ${ventureName}${ventureSlug ? ` (slug: ${ventureSlug})` : ''}

Specialists delivered:
${briefingText}

User: ${cleanMsg}${fileNote}${historyBlock}

Synthesise the specialist findings into a concise response — 150 words max. Lead with the key insight or decision, then your recommendation.

Trust the specialist reports above — they already explored the codebase and gathered data. Write your synthesis directly.`

  // Build CEO system prompt
  const ceoVentureScope = mode.isYvonDashboard
    ? `Active venture: YVON Dashboard. Codebase questions refer to the YVON OS local filesystem — Read/Bash/Glob/Grep are valid for this.`
    : mode.isLocalMode
    ? `Active venture: ${ventureName} (slug: ${ventureSlug}) — LOCAL MODE. ${mode.localRepoPath ? `Read/Bash/Glob/Grep CAN access the local repo at ${mode.localRepoPath}/ — always use FULL paths. Use Github(action=issues/prs) only for GitHub-specific data.` : `Local repo path not configured — use Github(action=file/tree/commits/issues) to read the venture repo.`}`
    : `Active venture: ${ventureName} (slug: ${ventureSlug}). ⛔ BLOCKED: Read, Bash, Glob, and Grep are NOT available to you for ${ventureName}. These tools access the YVON OS codebase — an entirely different repo. Calling them will fail with an error. For ${ventureName} repo access, use Github(action=file/tree/commits/issues) ONLY.`

  const ceoSystem = `You are Marcus, CEO of YVON synthesising specialist briefings.\n\n${ceoVentureScope}\n\nYour job: produce a single unified answer for the user.${
    doLocalVerify
      ? ` The user approved a fix — VERIFY it before confirming. Read the specific changed files in the local repo (Read/Glob with FULL paths) to confirm each change is actually present and the files are intact, then write your confirmation. Read ONLY the listed files; do not explore the project structure.`
      : mode.isLocalMode && mode.localRepoPath
      ? ` In local mode, specialists used Read/Bash on the local repo — trust their reports.`
      : ` Use Github tools ONLY when a claim needs verification against the live repo. The specialists already did the heavy exploration; trust their reports.`
  }`

  // ── Stream synthesis ───────────────────────────────────────────────────────
  let ceoSynthesis = ''

  // Check for attached images — route through streamWithTools for visual analysis
  const firstImage = files?.find(f => f.isImage)
  if (firstImage) {
    for await (const chunk of streamSynthesis({
      maxTokens: 8192,
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
      repoMode:     mode.isLocalMode ? 'local' : 'github',
      localRepoPath: mode.localRepoPath,
      modelTier:   'synthesis',
      system:      ceoSystem,
      maxTokens:   8192,
      // Report: 10. Local-mode verification: one read per changed file + headroom
      // to write the confirmation (capped). Otherwise 6.
      maxIterations: isReportRequest ? 10 : doLocalVerify ? Math.min(Math.max(changedFiles.length, 2) + 4, 16) : 6,
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

  return ceoSynthesis
}
