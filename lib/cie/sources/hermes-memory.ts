// lib/cie/sources/hermes-memory.ts — Hermes memory reader and query engine
//
// Reads ~/.hermes/memories/USER.md and MEMORY.md and provides:
//   getHermesUserContext()    → string (user preferences, always include, cap 300 chars)
//   getHermesMemoryContext()  → string (keyword-matched entries, cap 400 chars)
//   getHermesStandards()      → string[] (specific rules extracted from both files)
//   getHermesContextForTask() → string (task-relevant entries + user context)
//
// Files are cached in-memory; re-reads only if mtime changes.
// Missing files return empty strings / empty arrays gracefully.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { homedir } from 'node:os'

import type { TaskType } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMORIES_DIR = resolve(homedir(), '.hermes', 'memories')
const USER_PATH = resolve(MEMORIES_DIR, 'USER.md')
const MEMORY_PATH = resolve(MEMORIES_DIR, 'MEMORY.md')

// ─── Caches ───────────────────────────────────────────────────────────────────

let cachedUserContent: string | null = null
let cachedUserMtime = 0

let cachedMemoryContent: string | null = null
let cachedMemoryMtime = 0

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/** Read a file if it exists, caching by mtime. Returns empty string on missing. */
function readCached(path: string, cached: string | null, cachedMtime: number): {
  content: string
  mtime: number
} {
  if (!existsSync(path)) {
    return { content: '', mtime: 0 }
  }

  try {
    const { mtimeMs } = statSync(path)
    if (cached !== null && cachedMtime >= mtimeMs) {
      return { content: cached, mtime: cachedMtime }
    }
    const content = readFileSync(path, 'utf-8')
    return { content, mtime: mtimeMs }
  } catch {
    return { content: '', mtime: 0 }
  }
}

/** Truncate text to `cap` chars, appending '…' if truncated. */
function capChars(text: string, cap: number): string {
  if (text.length <= cap) return text
  return text.slice(0, cap) + '…'
}

// ─── Export 1: User Context ───────────────────────────────────────────────────

/**
 * Read USER.md — user preferences and constraints.
 * Always include in system prompt. Capped at 300 characters.
 * Returns empty string when USER.md does not exist.
 */
export function getHermesUserContext(): string {
  const { content, mtime } = readCached(USER_PATH, cachedUserContent, cachedUserMtime)
  cachedUserContent = content
  cachedUserMtime = mtime

  if (!content) return ''
  return capChars(content.trim(), 300)
}

// ─── Export 2: Memory Context (keyword search) ────────────────────────────────

/**
 * Parse MEMORY.md into individual entries.
 * Entries are separated by `§` markers.
 */
function parseMemoryEntries(raw: string): string[] {
  return raw
    .split('§')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

/**
 * Read MEMORY.md and return entries matching any of the given keywords
 * (case-insensitive substring match on the entry text).
 * Capped at 400 characters. Returns empty string when nothing matches
 * or MEMORY.md is missing.
 */
export function getHermesMemoryContext(keywords: string[]): string {
  const { content, mtime } = readCached(
    MEMORY_PATH,
    cachedMemoryContent,
    cachedMemoryMtime,
  )
  cachedMemoryContent = content
  cachedMemoryMtime = mtime

  if (!content || keywords.length === 0) return ''

  const keywordsLower = keywords.map((k) => k.toLowerCase().trim()).filter(Boolean)
  if (keywordsLower.length === 0) return ''

  const entries = parseMemoryEntries(content)
  const matched = entries.filter((entry) =>
    keywordsLower.some((kw) => entry.toLowerCase().includes(kw)),
  )

  if (matched.length === 0) return ''

  return capChars(matched.join('\n\n'), 400)
}

// ─── Export 3: Standards ──────────────────────────────────────────────────────

/**
 * Extract specific Hermes standards / rules from both USER.md and MEMORY.md.
 *
 * Returns an array of rule strings for:
 *   - AUDIT GATE
 *   - NO FAKE DATA
 *   - TOON FORMAT STANDARD
 *   - plan-first
 *   - additive-only
 *
 * Each standard is extracted as a concise one-line rule.
 */
export function getHermesStandards(): string[] {
  const standards: string[] = []

  // Read both files (bypass cache so we always get fresh standards on call,
  // but the cache is still populated for other exports).
  const { content: userContent } = readCached(USER_PATH, cachedUserContent, cachedUserMtime)
  cachedUserContent = userContent
  cachedUserMtime = readCached(USER_PATH, null, 0).mtime

  const { content: memoryContent } = readCached(
    MEMORY_PATH,
    cachedMemoryContent,
    cachedMemoryMtime,
  )
  cachedMemoryContent = memoryContent
  cachedMemoryMtime = readCached(MEMORY_PATH, null, 0).mtime

  const combined = [userContent, memoryContent].filter(Boolean).join('\n')

  // AUDIT GATE — in MEMORY.md
  if (/audit\s*gate/i.test(combined)) {
    standards.push(
      'AUDIT GATE: After significant code changes, run a full 4-agent technical audit (Dev/Raj/Mia/Quinn) before pushing. Each reports PASS/FAIL/WARN. Fix FAIL items.',
    )
  }

  // NO FAKE DATA — in both USER.md and MEMORY.md
  if (/no\s+fake\s+data/i.test(combined)) {
    standards.push(
      'NO FAKE DATA: Use real Supabase data or honest empty states. Never fabricate API responses, metrics, or file contents.',
    )
  }

  // TOON FORMAT STANDARD — in MEMORY.md
  if (/toon\s+(standard|format|dense|bidirectional)/i.test(combined)) {
    standards.push(
      'TOON FORMAT STANDARD: All agent data uses toon.dense() format. 84.5% bidirectional compression savings verified. lib/toon.ts for encode/decode.',
    )
  }

  // plan-first — in MEMORY.md
  if (/plan[\s-]*first|present.*plan.*before.*code/i.test(combined)) {
    standards.push(
      'PLAN-FIRST: Research existing code, present a structured plan listing each file to change before writing any code. Get confirmation, then implement.',
    )
  }

  // additive-only — in USER.md
  if (/additive[\s-]*only/i.test(combined)) {
    standards.push(
      'ADDITIVE-ONLY: Merge new features INTO existing codebase. Never delete YVON OS features. Extend, don\'t remove.',
    )
  }

  return standards
}

// ─── Export 4: Task-Relevant Context ──────────────────────────────────────────

/**
 * Map a TaskType to keywords relevant for searching Hermes memory.
 * These keyword sets are designed to pull the most relevant MEMORY.md
 * entries for each type of task.
 */
const TASK_KEYWORDS: Record<TaskType, string[]> = {
  backend_bug: ['error', 'api', 'route', 'type', 'build', 'supabase', 'database', 'route.ts'],
  strategy: ['architecture', 'direction', 'engine', 'plan', 'OS', 'ventures'],
  frontend_ui: ['UI', 'component', 'design', 'brand', 'layout', 'responsive'],
  data_query: ['query', 'database', 'schema', 'supabase', 'migration', 'data'],
  marketing: ['brand', 'social', 'instagram', 'analytics', 'content', 'campaign'],
  ops_risk: ['deploy', 'audit', 'security', 'auth', 'Vercel', 'GH'],
  general: ['YVON', 'OS', 'standard', 'architecture', 'ventures'],
}

/**
 * Return task-relevant Hermes memory entries for a given TaskType.
 *
 * Combines:
 *   1. User context (always included — capped at 300 chars).
 *   2. Memory entries matching task-type keywords (capped at 400 chars).
 *
 * Returns an empty string if neither source has content.
 */
export function getHermesContextForTask(taskType: TaskType): string {
  const userCtx = getHermesUserContext()
  const keywords = TASK_KEYWORDS[taskType] ?? TASK_KEYWORDS.general
  const memoryCtx = getHermesMemoryContext(keywords)

  const parts: string[] = []
  if (userCtx) parts.push(`[User Preferences]\n${userCtx}`)
  if (memoryCtx) parts.push(`[Task Memory]\n${memoryCtx}`)

  return parts.join('\n\n')
}

// ─── Utility: Invalidate caches ───────────────────────────────────────────────

/** Force re-read of both memory files on the next call. */
export function invalidateHermesMemoryCache(): void {
  cachedUserContent = null
  cachedUserMtime = 0
  cachedMemoryContent = null
  cachedMemoryMtime = 0
}
