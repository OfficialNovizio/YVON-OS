// lib/cie/sources/project-docs.ts — Project documentation reader
//
// Reads /root/yvon/CLAUDE.md and venture context docs. Provides:
//   getProjectArchitecture() → architecture section (capped 400 chars)
//   getProjectRules()        → key project rules as string[]
//   getVentureContext(venture: string) → venture CONTEXT.md content
//   getProjectContextForTask(taskType, venture) → relevant doc sections
//
// All results are cached in-memory; re-reads only on mtime change.
// Missing files return empty/gracful defaults — no throws.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import type { TaskType } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLAUDE_PATH = resolve('/root/yvon/CLAUDE.md')
const VENTURES_DIR = resolve('/root/yvon/docs/ventures')
const ARCHITECTURE_CAP = 400

// ─── Key Project Rules ────────────────────────────────────────────────────────
//
// These are the canonical project rules extracted from CLAUDE.md and
// project-wide conventions. They are synthesised, not parsed, because
// several are implicit architectural constraints rather than explicit
// bullet points in the markdown.

const PROJECT_RULES: string[] = [
  'Strict TypeScript — all code must pass `npm run build` type-check with zero errors. No `any` without explicit justification.',
  'No manual Vercel deploys — deployments go through the automated CI/CD pipeline only. Never use `vercel` CLI or dashboard deploy buttons.',
  'Audit gate — every agent call routes through `/api/gatekeeper` for pre-flight intent classification and context validation before any LLM call.',
  'Venture context from cookie — active venture flows via `yvon_active_venture` cookie read by `getActiveVentureSlugClient()`. No localStorage for venture state.',
]

// ─── Caching ──────────────────────────────────────────────────────────────────

interface CachedFile {
  content: string
  mtimeMs: number
}

let cachedClaude: CachedFile | null = null
const ventureCache = new Map<string, CachedFile>()

/** Read a file with mtime-based caching. Returns null when missing. */
function readCached(path: string, cache: CachedFile | null): { content: string; cache: CachedFile } | null {
  if (!existsSync(path)) return null

  try {
    const mtimeMs = statSync(path).mtimeMs
    if (cache && cache.mtimeMs >= mtimeMs) {
      return { content: cache.content, cache }
    }
  } catch {
    // stat failed — fall through to fresh read
  }

  const content = readFileSync(path, 'utf-8')
  const entry: CachedFile = { content, mtimeMs: 0 }
  try {
    entry.mtimeMs = statSync(path).mtimeMs
  } catch { /* keep 0 */ }

  return { content, cache: entry }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract a named section from markdown text.
 * Sections are delimited by `## Section Name` headers.
 * Returns the content between the header and the next `## ` or `---` line.
 */
function extractSection(raw: string, sectionName: string): string {
  const lines = raw.split('\n')
  let inSection = false
  const sectionLines: string[] = []

  for (const line of lines) {
    // Detect section start — match `## Section Name` (case-insensitive prefix)
    if (!inSection && line.startsWith('## ') && line.slice(3).trim().toLowerCase() === sectionName.toLowerCase()) {
      inSection = true
      continue // skip the header line itself
    }

    if (inSection) {
      // Stop at the next section header or horizontal rule
      if (line.startsWith('## ') || line.startsWith('---')) break
      sectionLines.push(line)
    }
  }

  return sectionLines.join('\n').trim()
}

/** Cap a string to `max` characters, adding '…' when truncated. */
function cap(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

// ─── Export: getProjectArchitecture ───────────────────────────────────────────

/**
 * Extract the "App Architecture" section from CLAUDE.md.
 * Capped at ${ARCHITECTURE_CAP} characters. Returns empty string when CLAUDE.md
 * is missing or the section isn't found.
 */
export function getProjectArchitecture(): string {
  const result = readCached(CLAUDE_PATH, cachedClaude)
  if (!result) return ''

  cachedClaude = result.cache
  const section = extractSection(result.content, 'App Architecture')
  return cap(section, ARCHITECTURE_CAP)
}

// ─── Export: getProjectRules ──────────────────────────────────────────────────

/**
 * Return the canonical project rules that must never be broken.
 * These are synthesised from CLAUDE.md critical rules and project-wide
 * conventions (TypeScript strictness, Vercel deploy discipline, audit
 * gate, and venture cookie flow).
 */
export function getProjectRules(): string[] {
  // Ensure CLAUDE.md is loaded (warms the cache) but don't fail if missing.
  readCached(CLAUDE_PATH, cachedClaude)
  return [...PROJECT_RULES]
}

// ─── Export: getVentureContext ────────────────────────────────────────────────

/**
 * Read the CONTEXT.md file for a given venture.
 *
 * Path: docs/ventures/{venture}/CONTEXT.md
 *
 * Returns the full file content, or an empty string if the venture
 * doesn't exist or has no CONTEXT.md. Results are cached by mtime.
 */
export function getVentureContext(venture: string): string {
  if (!venture || !/^[a-z0-9_-]+$/i.test(venture)) return ''

  const path = resolve(VENTURES_DIR, venture, 'CONTEXT.md')
  const cached = ventureCache.get(venture) ?? null
  const result = readCached(path, cached)

  if (!result) return ''

  ventureCache.set(venture, result.cache)
  return result.content
}

// ─── Export: getProjectContextForTask ─────────────────────────────────────────

/**
 * Return relevant project documentation sections for a given task type
 * and venture. Composes architecture + rules + venture context based
 * on what's relevant to the task.
 *
 * Task type → context mapping:
 *   - backend_bug / data_query / ops_risk  → architecture + rules
 *   - strategy / marketing                  → venture context + rules
 *   - frontend_ui                           → architecture + rules (venture if present)
 *   - general                               → architecture + rules + venture context
 *
 * Returns a formatted string with labelled sections. Empty sections
 * are omitted. Never throws — missing files result in missing sections
 * rather than errors.
 */
export function getProjectContextForTask(taskType: TaskType, venture: string): string {
  const sections: string[] = []

  // Architecture is relevant for all technical tasks
  const techTasks: TaskType[] = ['backend_bug', 'frontend_ui', 'data_query', 'ops_risk', 'general']
  if (techTasks.includes(taskType)) {
    const arch = getProjectArchitecture()
    if (arch) {
      sections.push(`## Architecture\n${arch}`)
    }
  }

  // Rules are always relevant
  const rules = getProjectRules()
  if (rules.length > 0) {
    sections.push(`## Project Rules\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`)
  }

  // Venture context is relevant for strategy, marketing, and general tasks
  const ventureTasks: TaskType[] = ['strategy', 'marketing', 'general']
  if (ventureTasks.includes(taskType)) {
    const ctx = getVentureContext(venture)
    if (ctx) {
      // Cap venture context to keep overall output reasonable
      sections.push(`## Venture Context (${venture})\n${cap(ctx, 2000)}`)
    }
  }

  return sections.join('\n\n')
}

// ─── Utility: Invalidate caches ───────────────────────────────────────────────

/** Force re-read of CLAUDE.md and all venture contexts on next access. */
export function invalidateProjectDocsCache(): void {
  cachedClaude = null
  ventureCache.clear()
}
