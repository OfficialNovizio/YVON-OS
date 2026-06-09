/**
 * lib/session.ts — War Room "engine v2" per-session isolation (Part A1).
 *
 * Goal: run many War Room sessions in parallel without any cross-session leakage.
 *
 * Mechanism: Node's AsyncLocalStorage gives every HTTP request its own async
 * context. We create one WarRoomSession per run and execute the whole pipeline
 * inside `runInSession(...)`. Anything deep in the stack (e.g. the Read tool) can
 * call `currentSession()` to reach THIS run's state — and physically cannot see
 * another run's. Parallel agents within a run share the same session (intended,
 * for cross-agent dedup); different runs get different sessions (isolated).
 *
 * Flagged OFF by default (WAR_ROOM_ENGINE_V2). When off, no session context is
 * established, `currentSession()` returns undefined, and every helper is a no-op —
 * behaviour is byte-identical to the legacy pipeline. Zero-risk to ship dark.
 */

import { AsyncLocalStorage } from 'async_hooks'

export interface SessionStats {
  fileReads: number   // execRead calls that hit disk
  cacheHits: number   // execRead calls served from the per-session cache
  invalidations: number
}

export interface WarRoomSession {
  id: string
  ventureSlug?: string
  repoMode: 'github' | 'local'
  localRepoPath?: string
  createdAt: number
  /** Per-session read-through file cache: absolute path -> raw content. */
  fileCache: Map<string, string>
  /** Per-session structure-query cache: Glob/Grep key -> serialized result. */
  queryCache: Map<string, string>
  stats: SessionStats
}

const als = new AsyncLocalStorage<WarRoomSession>()
let _seq = 0

// The on/off flag lives in lib/session-flag.ts (it reads the Vault setting and
// pulls in `server-only`). Keeping it out of here leaves this module pure and
// unit-testable (no server-only transitive import).

export function createSession(init: {
  ventureSlug?: string
  repoMode: 'github' | 'local'
  localRepoPath?: string
}): WarRoomSession {
  return {
    id: `s_${Date.now().toString(36)}_${(_seq++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    ventureSlug: init.ventureSlug,
    repoMode: init.repoMode,
    localRepoPath: init.localRepoPath,
    createdAt: Date.now(),
    fileCache: new Map(),
    queryCache: new Map(),
    stats: { fileReads: 0, cacheHits: 0, invalidations: 0 },
  }
}

/** Run `fn` with `session` as the ambient context for all nested async work. */
export function runInSession<T>(session: WarRoomSession, fn: () => Promise<T>): Promise<T> {
  return als.run(session, fn)
}

/**
 * Establish `session` for the remainder of the current async execution + all
 * following async calls, without a callback wrapper. Each request handler runs
 * in its own async context, so this is isolated per request. Use at the top of
 * a stream handler where wrapping the whole body in a closure would be invasive.
 */
export function enterSession(session: WarRoomSession): void {
  als.enterWith(session)
}

/** The session for the current async context, or undefined (legacy / flag off). */
export function currentSession(): WarRoomSession | undefined {
  return als.getStore()
}

// ─── Per-session file cache (all no-ops when there is no active session) ────────

/** Return cached raw file content for this session, or undefined on miss. */
export function sessionCacheGetFile(absPath: string): string | undefined {
  const s = als.getStore()
  if (!s) return undefined
  const hit = s.fileCache.get(absPath)
  if (hit !== undefined) s.stats.cacheHits++
  else s.stats.fileReads++
  return hit
}

/** Store raw file content in this session's cache. */
export function sessionCacheSetFile(absPath: string, content: string): void {
  als.getStore()?.fileCache.set(absPath, content)
}

/** Invalidate one path (call after any write/delete) so stale content is never served.
 *  Also clears the structure-query cache, since a write can change Glob/Grep results. */
export function sessionCacheInvalidate(absPath: string): void {
  const s = als.getStore()
  if (!s) return
  if (s.fileCache.delete(absPath)) s.stats.invalidations++
  if (s.queryCache.size > 0) s.queryCache.clear()  // conservative: a new/changed file alters listings
}

// ─── Per-session structure-query cache (Glob/Grep) — no-ops without a session ───

export function sessionQueryGet(key: string): string | undefined {
  const s = als.getStore()
  if (!s) return undefined
  const hit = s.queryCache.get(key)
  if (hit !== undefined) s.stats.cacheHits++
  return hit
}

export function sessionQuerySet(key: string, value: string): void {
  als.getStore()?.queryCache.set(key, value)
}
