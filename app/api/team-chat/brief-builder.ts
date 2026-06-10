/**
 * app/api/team-chat/brief-builder.ts — Structured specialist brief builder.
 *
 * Produces the { systemPrompt, userPrompt } pair for each specialist agent.
 * The system prompt is minimal (persona + mode + docs + skills). The user prompt
 * IS the structured brief — the LAST thing the agent reads, so it dominates
 * the model's attention.
 *
 * ⛔ MANDATORY OS SKILLS: 4 skills loaded from filesystem on EVERY call.
 *    Never cached. Never skipped. Execution aborted if all fail to load.
 *    Fixes Failures #1, #2, #3 from the War Room v3 diagnosis.
 */

import { getAgent, AGENTS } from '@/lib/agents'
import { getAgentMemory, getVentureAgentMemories, formatVentureMemoriesBlock } from '@/lib/agent-memory'
import { prefetchAgentMemory, searchSkills, trackSkillUsage } from '@/lib/db'
import fs from 'fs/promises'
import path from 'path'
import { loadConfig } from '@/lib/ai-client'
import type { AgentId, ExecutionPlan } from '@/lib/types'
import type { ModeContext } from './mode-resolver'

// ─── Re-export types used by route.ts ─────────────────────────────────────────

// These types are defined in route.ts but used here. Re-declare to avoid circular imports.
export interface RepoSnapshot {
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

export interface VentureDocParts {
  context:  string
  brand:    string
  design:   string
  feedback: string
}

export interface OsContext {
  workflowSummary: string
  sessionState:    string
  feedbackRules:   string
  ventureSession:  string
  skillKarpathy:   string
  skillMemory:     string
  skillSessionProtocol: string
  skillReflection: string
}

// ─── ⛔ MANDATORY OS SKILLS — LOADED FROM FILESYSTEM EVERY CALL ──────────────
// These 4 skills are the minimum operating system every agent MUST have.
// They are loaded from disk on every call. No cache. No skip. No exception.
// If ALL fail to load, the agent call is ABORTED — not degraded, ABORTED.
//
// This is structural enforcement. Like breathing for humans — not optional.

const MANDATORY_SKILL_PATHS = [
  'agent-department/shared/skills/coding/01-karpathy.md',
  'agent-department/shared/skills/agents/01-memory.md',
  'agent-department/shared/skills/operating-system/session-protocol/SKILL.md',
  'agent-department/shared/skills/operating-system/reflection-protocol/SKILL.md',
  'PROJECT.md',  // ← Living project knowledge base — structure, workflow, ventures, rules
]

let _mandatorySkillsCache: string | null = null
let _mandatorySkillsLoaded = false

async function loadMandatorySkills(): Promise<string> {
  const root = process.cwd()
  const skills: string[] = []

  for (const skillPath of MANDATORY_SKILL_PATHS) {
    try {
      const raw = await fs.readFile(path.join(root, skillPath), 'utf-8')
      skills.push(`<os-skill file="${skillPath}">\n${raw.slice(0, 4000)}\n</os-skill>`)
    } catch {
      console.error(`⛔ MANDATORY SKILL FAILED TO LOAD: ${skillPath}`)
    }
  }

  if (skills.length === 0) {
    throw new Error(
      '⛔ ALL MANDATORY SKILLS FAILED TO LOAD — agent execution blocked.\n' +
      `Checked paths: ${MANDATORY_SKILL_PATHS.join(', ')}\n` +
      'These skills are the minimum operating system for every agent.'
    )
  }

  return [
    '<os-mandatory-skills>',
    '⛔ THESE SKILLS ARE MANDATORY. They were loaded from the filesystem on this call. They are not cached. They are not optional. Apply every rule below to your work. No exceptions.',
    '',
    ...skills,
    '</os-mandatory-skills>',
  ].join('\n')
}

// ─── Agent role sets ──────────────────────────────────────────────────────────

const TECHNICAL_AGENTS = new Set<AgentId>(['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa'])
const MARKETING_AGENTS = new Set<AgentId>(['lena-brand', 'rio-ads', 'kai-analyst', 'nate-growth', 'atlas-art-director', 'pixel-production'])
const DESIGN_AGENTS    = new Set<AgentId>(['mia-frontend', 'atlas-art-director', 'pixel-production'])
const CEO_AGENTS       = new Set<AgentId>(['marcus-ceo', 'diana-coo'])

// ─── Snapshot formatter (moved from route.ts) ─────────────────────────────────

export function formatSnapshot(s: RepoSnapshot | null): string {
  if (!s) return ''
  const lines = [
    `Repo:          ${s.owner}/${s.repo}  ${s.isPrivate ? '(private)' : '(public)'}`,
    `Description:   ${s.description ?? '(none)'}`,
    `URL:           ${s.url}`,
    `Default branch: ${s.branch}    Stars: ${s.stars}    Open issues: ${s.openIssues}`,
    `Last updated:  ${s.updatedAt}`,
    ``,
    `⛔ FULL PROJECT FILE TREE (${s.topLevelFiles.length} files) — THIS IS GROUND TRUTH. DO NOT RE-EXPLORE.`,
    `Every file in this project is listed below. You do NOT need to list directories,`,
    `run tree/ls/find, or call Github(action=tree). Go directly to reading the specific`,
    `files you need with Read(file_path) or Github(action=file).`,
    ``,
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

// ─── Venture docs block builder ───────────────────────────────────────────────

export function buildVentureDocsBlock(parts: VentureDocParts | undefined, agentId: AgentId): string {
  if (!parts) return ''
  const sections: string[] = []
  if (parts.context) sections.push(parts.context)
  if (MARKETING_AGENTS.has(agentId) || CEO_AGENTS.has(agentId)) {
    if (parts.brand) sections.push(parts.brand)
  }
  if (parts.feedback) sections.push(parts.feedback)
  if (DESIGN_AGENTS.has(agentId)) {
    if (parts.design) sections.push(parts.design)
  }
  return sections.length > 0
    ? `<venture-docs>\n[Live from Supabase venture_documents — role-relevant sections for this agent. Use as source of truth for venture identity.]\n\n${sections.join('\n\n')}\n</venture-docs>`
    : ''
}

// ─── OS context block builder ─────────────────────────────────────────────────

function buildOsContextBlock(osContext: OsContext | undefined, ventureName: string): string {
  if (!osContext) return ''
  const parts: string[] = []

  if (osContext.workflowSummary) {
    parts.push(`<os-workflow>\n[YVON execution protocol — you are in PERFORMING phase. Follow this model.]\n\n${osContext.workflowSummary}\n</os-workflow>`)
  }
  if (osContext.sessionState) {
    parts.push(`<os-session>\n[Global in-flight state — read for continuity across sessions.]\n\n${osContext.sessionState}\n</os-session>`)
  }
  if (osContext.feedbackRules) {
    parts.push(`<os-feedback>\n[Critical never-again rules — mandatory compliance. These override default behaviour.]\n\n${osContext.feedbackRules}\n</os-feedback>`)
  }
  if (osContext.ventureSession && ventureName) {
    parts.push(`<venture-session>\n[${ventureName} venture session state — current in-flight work and open decisions.]\n\n${osContext.ventureSession}\n</venture-session>`)
  }
  // OS operating skills — mandatory for all specialists
  if (osContext.skillKarpathy) {
    parts.push(`<os-skill-karpathy>\n[CRITICAL — Coding behaviour rules. Non-negotiable. Apply these patterns to ALL code you write or review: think before coding, simplicity first, surgical changes, goal-driven execution, tool boundaries.]\n\n${osContext.skillKarpathy}\n</os-skill-karpathy>`)
  }
  if (osContext.skillMemory) {
    parts.push(`<os-skill-memory>\n[Memory system rules — how to load context, write session entries, and manage token budget.]\n\n${osContext.skillMemory}\n</os-skill-memory>`)
  }
  if (osContext.skillSessionProtocol) {
    parts.push(`<os-skill-session>\n[Session protocol — start/end obligations, file load order, memory write format. Follow this for every task.]\n\n${osContext.skillSessionProtocol}\n</os-skill-session>`)
  }
  if (osContext.skillReflection) {
    parts.push(`<os-skill-reflection>\n[Reflection protocol — post-delivery learning capture. After completing your task, capture what was learned to the right memory location.]\n\n${osContext.skillReflection}\n</os-skill-reflection>`)
  }

  return parts.join('\n\n')
}

// ─── Main brief builder ───────────────────────────────────────────────────────

export interface BuildBriefParams {
  agentId: AgentId
  plan: ExecutionPlan
  mode: ModeContext
  snapshot: RepoSnapshot | null
  ventureDocs?: VentureDocParts
  osContext?: OsContext
  message: string
  ventureName: string
  ventureSlug?: string
  conversationHistory?: Array<{ user: string; marcus: string }>
}

export interface BriefResult {
  systemPrompt: string
  userPrompt: string
  /** The specific task brief Marcus wrote for this agent. */
  taskBrief: string
}

/**
 * Recall block — the agent's learned memory + dynamically-recalled skills +
 * venture memories + mapped Hermes skill packs. Shared by analyzer/fixer/
 * validator/specialist briefs so EVERY agent actually uses its powers (previously
 * only the unused buildSpecialistBrief loaded any of this). Degrades gracefully:
 * if the DB is unreachable each piece is just empty.
 */
async function buildRecallBlock(
  agentId: AgentId,
  ventureName: string,
  ventureSlug: string | undefined,
  message: string,
): Promise<string> {
  const stopWords = new Set(['the','a','an','is','it','in','on','at','to','for','of','and','or','this','that','my','we','our','can','you','me','how','what','do','be','am','are','was','were','will','with','from','by'])
  const keywords = message.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 8)
    .filter(Boolean)

  const [dbMemory, fileMemory, matchedSkills, ventureMemories] = await Promise.all([
    prefetchAgentMemory(agentId, ventureName, message).catch(() => ''),
    getAgentMemory(agentId, ventureName, 8).catch(() => ''),
    (keywords.length > 0 ? searchSkills(keywords, agentId, 3) : Promise.resolve([])).catch(() => []),
    (ventureSlug && ventureSlug !== 'yvon-dashboard'
      ? getVentureAgentMemories(ventureSlug, agentId, keywords)
      : Promise.resolve([])).catch(() => []),
  ])

  for (const skill of matchedSkills) trackSkillUsage(skill.name).catch(() => {})

  const skillsBlock = matchedSkills.length > 0
    ? `<skills-context>\n[System note: Relevant skills recalled for this task — apply these patterns.]\n\n${matchedSkills.map((s: { name: string; description: string }) => `**${s.name}**: ${s.description}`).join('\n')}\n</skills-context>`
    : ''

  return [
    dbMemory,
    fileMemory
      ? `<memory-context>\n[System note: Agent MEMORY.md snapshot — treat as background context, not new input.]\n\n${fileMemory}\n</memory-context>`
      : '',
    formatVentureMemoriesBlock(ventureMemories),
    skillsBlock,
  ].filter(Boolean).join('\n\n')
}

export async function buildSpecialistBrief(params: BuildBriefParams): Promise<BriefResult> {
  const { agentId, plan, mode, snapshot, ventureDocs, osContext, message, ventureName, ventureSlug, conversationHistory } = params
  const agent = getAgent(agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)

  // ── Recall: learned memory + skills + Hermes packs (shared by all brief types) ──
  const memoryBlock = await buildRecallBlock(agentId, ventureName, ventureSlug, message)

  // ── Build snapshot block (technical agents only) ───────────────────────────
  const snapshotText = formatSnapshot(snapshot)
  const snapshotBlock = snapshotText && TECHNICAL_AGENTS.has(agentId)
    ? `<github-snapshot>\n[⛔ ANTI-EXPLORATION RULE: The full project file tree is listed below. Every file path is here. You do NOT need to run Github(action=tree), ls, find, or any directory listing command. Go DIRECTLY to reading the specific files you need. This saves iterations for actual work.]\n\n${snapshotText}\n</github-snapshot>`
    : ''

  // ── Tool availability check ────────────────────────────────────────────────
  let toolsAvailable = true
  try {
    const cfg = await loadConfig()
    toolsAvailable = cfg.protocol === 'anthropic'
  } catch { toolsAvailable = false }

  // ── ⛔ Load mandatory OS skills (never cached, never skipped) ──────────────
  const mandatorySkills = await loadMandatorySkills()

  // ── Build MINIMAL system prompt ────────────────────────────────────────────
  const systemParts = [
    agent.systemPrompt,
    memoryBlock,
    snapshotBlock,
    mode.ventureScopeBlock,
    buildVentureDocsBlock(ventureDocs, agentId),
    mode.toolGuidanceBlock,
    buildOsContextBlock(osContext, ventureName),
    mandatorySkills,  // ⛔ ALWAYS PRESENT — loaded from filesystem on every call
  ].filter(Boolean)

  const systemPrompt = systemParts.join('\n\n')

  // ── Build the structured user brief ────────────────────────────────────────
  // This IS the task prompt. Nothing else. The format is fixed.
  // The Karpathy rules come LAST so they dominate model attention.

  const taskBrief = plan.each_agent_task?.[agentId] ?? message.slice(0, 200)

  // Conversation history injection
  const historyNote = conversationHistory && conversationHistory.length > 0
    ? `\n\n## Prior Conversation Context\n${conversationHistory.map(h => `**User:** ${h.user}\n**Marcus:** ${h.marcus}`).join('\n\n')}`
    : ''

  // Flutter tech stack detection
  const isFlutter = mode.techStack.includes('Flutter')
  const flutterNote = isFlutter
    ? `\n\nFLUTTER PROJECT — FILE PATH RULES:\n- ALL .dart source files MUST be placed under \`lib/\` — NEVER at repo root\n- lib/models/ — data model classes\n- lib/services/demo/ — demo/seed service classes\n- lib/screens/ — screen widgets\n- test/ — test files only\n⛔ NEVER create .py, .sh, .rb, or ANY non-Dart file in a Flutter project`
    : ''

  // Build the structured brief
  const readInstr = mode.readCommand
  const writeInstr = mode.writeCommand

  const noToolsBanner = !toolsAvailable
    ? `\n\n⛔ CRITICAL: Your AI provider does NOT support tool use (Read, Write, Bash, Github are all unavailable). You CANNOT read or write files. Instead, analyze the situation from context and tell the user EXACTLY what needs to change: specific file paths, exact code changes needed, line numbers if possible. Be so precise that a developer could apply your fix without asking questions.\n`
    : ''

  const brief = `## TASK
${taskBrief}

## VENTURE
${ventureName}${ventureSlug ? ` (${ventureSlug})` : ''} — ${mode.techStack}

## HOW TO WORK
Read files: ${readInstr}
Write files: ${writeInstr}
${flutterNote}${historyNote}${noToolsBanner}

## KARPATHY RULES — READ THESE LAST (they override everything above)
⛔ SURGICAL CHANGES: Fix ONLY what your task brief says. Do NOT fix unrelated issues even if you find them.
⛔ SIMPLICITY FIRST: Minimum code that solves the problem. No abstractions for single-use code.
⛔ GOAL-DRIVEN: Read → Fix → Write → Confirm. Stop when the task is done.
⛔ NEVER HALLUCINATE WRITES: Every file write MUST have a visible Github(action=write_file) tool call.
⛔ DO NOT EXPLORE: The snapshot above contains the full file tree. Read ONLY the files you need.
⛔ If you find other issues: add "NOTE: also found [X]" at the end. Do NOT fix them.

## CONFIRM WHEN DONE
Reply with exactly what you fixed: file path(s), what changed, and any commit SHA from the tool result.
If you could not fix something: say "UNFIXED: [reason]" — be specific about what blocked you.`

  return { systemPrompt, userPrompt: brief, taskBrief }
}

// ─── ⚡ ROLE-AWARE BRIEF BUILDERS ───────────────────────────────────────────
// Every agent doesn't need the full context. This is why the pipeline was slow.
//
// ANALYZER (first sequential agent, or solo agent):
//   Full snapshot + tools + docs + OS skills. This agent explores.
//   System prompt: ~20KB. Runs ONCE per pipeline.
//
// FIXER (agents 2+ in sequential):
//   NO snapshot. NO venture docs. Minimal OS skills. Gets exact file paths.
//   System prompt: ~3KB. Runs for every agent after the first.
//
// VALIDATOR (Quinn, Kahneman, Felix):
//   Rubric + changed files only. NO snapshot, NO venture docs.
//   System prompt: ~2KB. Runs once per department.

export interface RoleAwareBriefParams {
  agentId: AgentId
  role: 'analyzer' | 'fixer' | 'validator'
  plan: ExecutionPlan
  mode: ModeContext
  snapshot?: RepoSnapshot | null
  ventureDocs?: VentureDocParts
  osContext?: OsContext
  message: string
  ventureName: string
  ventureSlug?: string
  conversationHistory?: Array<{ user: string; marcus: string }>
  /** Files the analyzer identified that need fixing (from previous agent output). */
  filesToFix?: string[]
  /** The validator rubric to use (for validator role). */
  rubric?: string
}

/**
 * ANALYZER brief — full context, exploration permitted.
 * For: first sequential agent, solo agents, Marcus (direct path).
 */
export async function buildAnalyzerBrief(params: RoleAwareBriefParams): Promise<BriefResult> {
  const { agentId, plan, mode, snapshot, ventureDocs, osContext, message, ventureName, ventureSlug, conversationHistory } = params
  const agent = getAgent(agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)

  const [mandatorySkills, recall] = await Promise.all([
    loadMandatorySkills(),
    buildRecallBlock(agentId, ventureName, ventureSlug, message),
  ])
  const taskBrief = plan.each_agent_task?.[agentId] ?? message.slice(0, 200)
  const snapshotBlock = snapshot
    ? `<github-snapshot>\n[⛔ FULL FILE TREE — ground truth. Explore ONLY what you need, then stop.]\n\n${formatSnapshot(snapshot)}\n</github-snapshot>`
    : ''

  const historyNote = conversationHistory?.length
    ? `\n\n## Prior Context\n${conversationHistory.map(h => `**User:** ${h.user}\n**Marcus:** ${h.marcus}`).join('\n\n')}`
    : ''

  const systemPrompt = [
    agent.systemPrompt,
    recall,
    mode.ventureScopeBlock,
    mode.toolGuidanceBlock,
    snapshotBlock,
    buildVentureDocsBlock(ventureDocs, agentId),
    mandatorySkills,
  ].filter(Boolean).join('\n\n')

  const userPrompt = `## ROLE: ANALYZER — You are the FIRST agent in the pipeline.
Your job: diagnose the issue, identify EXACT file paths and changes needed, then fix if you can.

## TASK
${taskBrief}

## EXPLORATION RULES
✅ You MAY explore files to understand the issue.
✅ Read files, grep for patterns, check imports.
⛔ Once you identify the fix, APPLY IT immediately. Do NOT keep exploring.
⛔ After fixing, list every file you changed with its exact path.

## VENTURE
${ventureName} — ${mode.techStack}
Read: ${mode.readCommand}
Write: ${mode.writeCommand}${historyNote}

## KARPATHY — READ LAST
⛔ Fix ONLY what your task says. Note other issues but don't fix them.
⛔ Simplicity first. Minimum code.
⛔ Every write_file must have a visible tool call.
⛔ When done: list ALL files changed + commit SHAs.`

  return { systemPrompt, userPrompt, taskBrief }
}

/**
 * FIXER brief — MINIMAL context, NO exploration.
 * For: agents 2+ in sequential. Gets exact file paths from the plan or
 * previous agent output. System prompt under 5KB → fast execution.
 */
export async function buildFixerBrief(params: RoleAwareBriefParams): Promise<BriefResult> {
  const { agentId, plan, mode, message, ventureName, conversationHistory, filesToFix } = params
  const agent = getAgent(agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)

  const [mandatorySkills, recall] = await Promise.all([
    loadMandatorySkills(),
    buildRecallBlock(agentId, ventureName, params.ventureSlug, message),
  ])
  const taskBrief = plan.each_agent_task?.[agentId] ?? message.slice(0, 200)

  const fileList = filesToFix?.length
    ? `\n\n## EXACT FILES TO FIX (do NOT read any other files)\n${filesToFix.map(f => `- ${f}`).join('\n')}`
    : ''

  const historyNote = conversationHistory?.length
    ? `\n\n## Prior Context\n${conversationHistory.map(h => `**User:** ${h.user}\n**Marcus:** ${h.marcus}`).join('\n\n')}`
    : ''

  // Recall (memory + skills + Hermes packs) added so fixers apply learned patterns.
  const systemPrompt = [
    agent.systemPrompt,
    recall,
    mode.ventureScopeBlock,
    mode.toolGuidanceBlock,
    mandatorySkills,
  ].filter(Boolean).join('\n\n')

  const userPrompt = `## ROLE: FIXER — You are a subsequent agent in the pipeline.
⛔ DO NOT EXPLORE. The analyzer already found the files. Fix ONLY what's listed below.

## TASK
${taskBrief}${fileList}

## HOW TO WORK
1. Read ONLY the files listed above: ${mode.readCommand}
2. Apply the EXACT changes specified in your task
3. Write each fixed file: ${mode.writeCommand}
4. Confirm every fix with file path + commit SHA

## VENTURE
${ventureName} — ${mode.techStack}${historyNote}

## KARPATHY — READ LAST (these override everything)
⛔ IMPACT CHECK: Before you rename, move, extract, or change the signature of any method/class/field, call GraphQuery(target) to find EVERY call site — then update all of them. Half-applied refactors are the #1 cause of broken builds.
⛔ SURGICAL: Fix ONLY what's listed. Touch nothing else.
⛔ SIMPLE: Minimum code. No abstractions. No "while I'm here" fixes.
⛔ WRITE PROOF: Every file change must show a Github write_file call.
⛔ DONE MEANS DONE: Stop when all listed files are fixed. Do not keep looking.
⛔ If a file path doesn't exist: report it. Do NOT search for alternatives.`

  return { systemPrompt, userPrompt, taskBrief }
}

/**
 * VALIDATOR brief — rubric only, no snapshot, no docs.
 * For: Quinn QA, Kahneman, Felix. System prompt under 2KB.
 */
export async function buildValidatorBrief(params: RoleAwareBriefParams): Promise<BriefResult> {
  const { agentId, plan, mode, message, rubric, filesToFix, snapshot, ventureName, ventureSlug } = params
  const agent = getAgent(agentId)
  if (!agent) throw new Error(`Unknown agent: ${agentId}`)

  const [mandatorySkills, recall] = await Promise.all([
    loadMandatorySkills(),
    buildRecallBlock(agentId, ventureName, ventureSlug, message),
  ])
  const taskBrief = plan.each_agent_task?.[agentId] ?? message.slice(0, 200)

  const fileList = filesToFix?.length
    ? `\n\n## FILES TO CHECK (check only these)\n${filesToFix.map(f => `- ${f}`).join('\n')}`
    : ''

  const rubricBlock = rubric
    ? `\n\n## VALIDATION RUBRIC\n${rubric}`
    : ''

  // Snapshot so Quinn stops re-exploring the tree every validation (token waste).
  const snapshotBlock = snapshot
    ? `<github-snapshot>\n[⛔ FULL FILE TREE — do NOT run Glob/find/ls to discover files. Go straight to the files you must check.]\n\n${formatSnapshot(snapshot)}\n</github-snapshot>`
    : ''

  // Validator now also gets recall (e.g. Quinn ← adversarial-ux-test pack + QA memory).
  const systemPrompt = [
    agent.systemPrompt,
    recall,
    mode.toolGuidanceBlock,
    snapshotBlock,
    mandatorySkills,
    '⛔ VALIDATOR TOOL RESTRICTION: You are READ-ONLY. Github write_file and delete_file are BLOCKED. You may ONLY use Read, Glob, Grep, Bash, GraphQuery, and Github read actions (file, tree, issues, commits). Attempting write_file or delete_file WILL FAIL. Report errors — the specialist fixes them.',
  ].filter(Boolean).join('\n\n')

  const userPrompt = `## ROLE: VALIDATOR — READ-ONLY. Verify, don't modify.
⛔ You CANNOT write files. You are a QA gate — REPORT only.
⛔ Github write_file and delete_file are BLOCKED for validators.

## TASK
${taskBrief}${fileList}${rubricBlock}

## HOW TO WORK
Read files: ${mode.readCommand}
⛔ NEVER write files. You are QA — report errors, let the specialist fix them.
⛔ NEVER try to restore/rewrite files yourself. Flag damage, don't repair it.

## VENTURE
${params.ventureName} — ${mode.techStack}

## VERDICT FORMAT
---QA-VERDICT---
status: PASS | FAIL
errors:
- [file]: [specific error]
recommendation: [what the specialist should fix — be specific]
---END-QA---

## KARPATHY
⛔ READ-ONLY: You cannot write. Report only.
⛔ Check ONLY files listed above. Don't explore.
⛔ If a file was truncated/damaged: FLAG it. Do NOT try to restore it.
⛔ Be specific: file path + line number + what's wrong.`

  return { systemPrompt, userPrompt, taskBrief }
}
