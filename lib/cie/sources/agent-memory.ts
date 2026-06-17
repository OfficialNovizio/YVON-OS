// lib/cie/sources/agent-memory.ts — Agent MEMORY.md parser and cross-agent rules
//
// Reads /root/yvon/.toon/agents/[Dept]/[agent]/MEMORY.md files and extracts:
//   Never Again rules, Architecture Decisions, Rejected Patterns, and Personality.
//
// Exports:
//   getAgentMemoryRules(agentId) → AgentMemoryRules
//   getCrossAgentRules(taskType, currentAgentId) → string[]
//   getAllAgentMemoryStatus() → { agentId, rulesCount }[]

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import type { AgentMemoryRules, TaskType } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPT_ROOT = resolve('/root/yvon/.toon/agents')

/** Maps agent short-names and hyphenated IDs to department/folder paths. */
const AGENT_PATH_MAP: Record<string, string> = {
  // CEO
  marcus: 'CEO/marcus',
  'marcus-ceo': 'CEO/marcus',
  // COO
  diana: 'COO/diana',
  'diana-coo': 'COO/diana',
  // Technical
  dev: 'Technical/dev',
  'dev-lead': 'Technical/dev',
  mia: 'Technical/mia',
  'mia-frontend': 'Technical/mia',
  raj: 'Technical/raj',
  'raj-backend': 'Technical/raj',
  quinn: 'Technical/quinn',
  'quinn-qa': 'Technical/quinn',
  // Marketing
  kai: 'Marketing/kai',
  'kai-analyst': 'Marketing/kai',
  lena: 'Marketing/lena',
  'lena-brand': 'Marketing/lena',
  nate: 'Marketing/nate',
  'nate-growth': 'Marketing/nate',
  atlas: 'Marketing/atlas',
  'atlas-art-director': 'Marketing/atlas',
  pixel: 'Marketing/pixel',
  'pixel-production': 'Marketing/pixel',
  // Finance
  felix: 'Finance/felix',
  'felix-finance': 'Finance/felix',
  // Psychology
  'daniel_kahneman': 'Psychology/Daniel_Kahneman',
  kahneman: 'Psychology/Daniel_Kahneman',
}

/** The Psychology agent uses lowercase memory.md instead of MEMORY.md. */
const LOWERCASE_MEMORY_AGENTS = new Set(['daniel_kahneman', 'kahneman'])

// ─── Types ────────────────────────────────────────────────────────────────────

/** Parsed content extracted from one MEMORY.md file. */
interface ParsedMemory {
  neverAgain: string[]
  architectureLocks: string[]
  rejectedPatterns: string[]
  personality: string
}

/** Cache entry keyed by agent ID. */
interface CacheEntry {
  parsed: ParsedMemory
  mtimeMs: number
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const cache = new Map<string, CacheEntry>()

// ─── Agent ID Resolution ─────────────────────────────────────────────────────

/**
 * Resolve an agent ID to the relative path from DEPT_ROOT.
 * Returns the path on success, or null if the agent is unknown.
 */
function resolveAgentPath(agentId: string): string | null {
  // Direct hit
  if (AGENT_PATH_MAP[agentId]) {
    return AGENT_PATH_MAP[agentId]
  }

  // Try normalizing: lowercase, strip hyphens
  const normalized = agentId.toLowerCase()
  if (AGENT_PATH_MAP[normalized]) {
    return AGENT_PATH_MAP[normalized]
  }

  // Try splitting on hyphen and using the first token
  const firstToken = normalized.split('-')[0]
  if (AGENT_PATH_MAP[firstToken]) {
    return AGENT_PATH_MAP[firstToken]
  }

  return null
}

/**
 * Determine the MEMORY.md filename for a given agent.
 * Most agents use uppercase MEMORY.md; Kahneman uses lowercase memory.md.
 */
function getMemoryFilename(agentId: string): string {
  const normalized = agentId.toLowerCase()
  return LOWERCASE_MEMORY_AGENTS.has(normalized) ? 'memory.md' : 'MEMORY.md'
}

// ─── Section Parsers ─────────────────────────────────────────────────────────

/**
 * Extract bullet-point list items from a markdown section.
 * Recognizes lines starting with '- ' (with optional prefixes like '- ❌').
 * Stops at the next '## ' heading or '---' horizontal rule.
 */
function extractBulletList(lines: string[], startIdx: number): string[] {
  const items: string[] = []
  let i = startIdx

  for (; i < lines.length; i++) {
    const line = lines[i]

    // Stop at next section heading or horizontal rule
    if (/^##\s/.test(line) || line.trim() === '---') {
      break
    }

    // Match bullet items: "- text" or "- ❌ text" etc.
    const trimmed = line.trim()
    if (/^-\s/.test(trimmed)) {
      // Remove the leading "- " and any icon prefix like "❌ "
      const content = trimmed.replace(/^-\s*(?:❌\s*)?/, '').trim()
      if (content) {
        items.push(content)
      }
    }
  }

  return items
}

/**
 * Extract the full text content of a markdown section (after its heading).
 * Captures all lines until the next '## ' heading or '---' horizontal rule.
 * Excludes empty leading/trailing whitespace and the section heading itself.
 */
function extractSectionText(lines: string[], startIdx: number): string {
  const sectionLines: string[] = []
  let i = startIdx

  for (; i < lines.length; i++) {
    const line = lines[i]

    // Stop at next section heading or horizontal rule
    if (/^##\s/.test(line) || line.trim() === '---') {
      break
    }

    sectionLines.push(line)
  }

  // Trim leading and trailing blank lines
  while (sectionLines.length > 0 && sectionLines[0].trim() === '') {
    sectionLines.shift()
  }
  while (sectionLines.length > 0 && sectionLines[sectionLines.length - 1].trim() === '') {
    sectionLines.pop()
  }

  return sectionLines.join('\n').trim()
}

/**
 * Find the line index (0-based) where a markdown section heading begins.
 * Returns -1 if not found. Matches headings like "## Never Again" or
 * "## Architecture Decisions (locked — do not re-debate)".
 */
function findSectionHeading(lines: string[], headingName: string): number {
  const pattern = new RegExp(
    `^##\\s+${headingName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  )
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return i
    }
  }
  return -1
}

// ─── File Reader & Parser ────────────────────────────────────────────────────

/**
 * Read and parse a single MEMORY.md file into a ParsedMemory struct.
 * Returns empty arrays/strings for missing sections.
 */
function parseMemoryFile(filePath: string): ParsedMemory {
  if (!existsSync(filePath)) {
    return { neverAgain: [], architectureLocks: [], rejectedPatterns: [], personality: '' }
  }

  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n')

  const result: ParsedMemory = {
    neverAgain: [],
    architectureLocks: [],
    rejectedPatterns: [],
    personality: '',
  }

  // ── Never Again ─────────────────────────────────────────────────────
  const naIdx = findSectionHeading(lines, 'Never Again')
  if (naIdx >= 0) {
    result.neverAgain = extractBulletList(lines, naIdx + 1)
  }

  // ── Architecture Decisions ───────────────────────────────────────────
  const archIdx = findSectionHeading(lines, 'Architecture Decisions')
  if (archIdx >= 0) {
    result.architectureLocks = extractBulletList(lines, archIdx + 1)
  }

  // ── Rejected Patterns ────────────────────────────────────────────────
  const rpIdx = findSectionHeading(lines, 'Rejected Patterns')
  if (rpIdx >= 0) {
    result.rejectedPatterns = extractBulletList(lines, rpIdx + 1)
  }

  // ── Personality Baseline ─────────────────────────────────────────────
  const persIdx = findSectionHeading(lines, 'Personality Baseline')
  if (persIdx >= 0) {
    result.personality = extractSectionText(lines, persIdx + 1)
  }

  return result
}

/**
 * Load a parsed MEMORY.md for the given agent, using an mtime-based cache.
 * Returns the cached result if the file hasn't changed since last read.
 */
function loadCached(agentId: string): ParsedMemory {
  const normalizedId = agentId.toLowerCase()
  const filePath = resolveAgentPath(normalizedId)

  if (!filePath) {
    return { neverAgain: [], architectureLocks: [], rejectedPatterns: [], personality: '' }
  }

  const absPath = resolve(DEPT_ROOT, filePath, getMemoryFilename(agentId))

  if (!existsSync(absPath)) {
    return { neverAgain: [], architectureLocks: [], rejectedPatterns: [], personality: '' }
  }

  // Check cache freshness
  let mtimeMs = 0
  try {
    mtimeMs = statSync(absPath).mtimeMs
  } catch {
    // If stat fails, parse fresh
  }

  const entry = cache.get(normalizedId)
  if (entry && entry.mtimeMs >= mtimeMs) {
    return entry.parsed
  }

  const parsed = parseMemoryFile(absPath)
  cache.set(normalizedId, { parsed, mtimeMs })
  return parsed
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Read an agent's MEMORY.md and return extracted rules, architecture locks,
 * rejected patterns, and personality description.
 *
 * Handles missing files gracefully — returns empty arrays and empty string
 * for any section that doesn't exist in the agent's MEMORY.md.
 */
export function getAgentMemoryRules(agentId: string): AgentMemoryRules {
  const parsed = loadCached(agentId)
  return {
    neverAgain: parsed.neverAgain,
    architectureLocks: parsed.architectureLocks,
    rejectedPatterns: parsed.rejectedPatterns,
    personality: parsed.personality,
  }
}

/**
 * Return cross-agent memory rules relevant to a given task type.
 *
 * Rules:
 * - **strategy tasks**: include Marcus's Never Again rules
 * - **backend tasks** (backend_bug, data_query): include Dev's Never Again rules
 * - **all tasks**: include Felix's financial guardrail rules (never hardcode,
 *   never skip DRI, never single-scenario models, etc.)
 *
 * Deduplicates rules that appear in multiple agent lists.
 */
export function getCrossAgentRules(
  taskType: TaskType,
  currentAgentId: string,
): string[] {
  const rules: string[] = []
  const seen = new Set<string>()

  function addRules(agentId: string): void {
    const { neverAgain } = loadCached(agentId)
    for (const rule of neverAgain) {
      const key = rule.toLowerCase().trim()
      if (!seen.has(key)) {
        seen.add(key)
        rules.push(rule)
      }
    }
  }

  // Strategy tasks → Marcus's Never Again
  if (taskType === 'strategy') {
    addRules('marcus')
  }

  // Backend tasks → Dev's Never Again
  if (taskType === 'backend_bug' || taskType === 'data_query') {
    addRules('dev')
  }

  // All tasks → Felix's financial guardrail rules
  addRules('felix')

  return rules
}

/**
 * Return status counts for all known agents — used for dashboard display.
 *
 * Only includes agents whose MEMORY.md files actually exist on disk.
 * Returns the agent's display ID and the total count of Never Again rules
 * they have recorded.
 */
export function getAllAgentMemoryStatus(): { agentId: string; rulesCount: number }[] {
  const result: { agentId: string; rulesCount: number }[] = []

  // Deduplicate by normalized ID to avoid double-counting hyphenated aliases
  const processed = new Set<string>()

  for (const agentId of Object.keys(AGENT_PATH_MAP)) {
    const normalizedId = agentId.toLowerCase()

    // Skip aliases (hyphenated IDs) — only process short-names
    if (agentId.includes('-')) continue
    if (processed.has(normalizedId)) continue
    processed.add(normalizedId)

    const filePath = resolveAgentPath(agentId)
    if (!filePath) continue

    const absPath = resolve(DEPT_ROOT, filePath, getMemoryFilename(agentId))
    if (!existsSync(absPath)) continue

    const parsed = loadCached(agentId)
    result.push({
      agentId: normalizedId,
      rulesCount: parsed.neverAgain.length,
    })
  }

  return result
}
