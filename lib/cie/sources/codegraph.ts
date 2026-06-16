// lib/cie/sources/codegraph.ts — Codegraph report parser and query engine
//
// Reads /root/yvon/graphify-out/CODEGRAPH_REPORT.md and provides:
//   getCodegraphReport() → { hubFiles, fanOutFiles, apiDeps }
//   queryCodegraph(filePaths: string[]) → top-5 TOON string
//   queryBlastRadius(file: string) → all dependents via BFS
//
// TOON format: 'D|hub|file|count|risk'

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import type { CodegraphHub } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_PATH = resolve('/root/yvon/.toon/codegraph/CODEGRAPH_REPORT.md')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodegraphReport {
  hubFiles: CodegraphHub[]
  fanOutFiles: string[]
  apiDeps: Record<string, string[]>
}

// ─── Report Loader / Parser ──────────────────────────────────────────────────

let cachedReport: CodegraphReport | null = null
let cachedMtime = 0

/** Compute risk tier from importer count. */
function computeRisk(importers: number): CodegraphHub['risk'] {
  if (importers >= 50) return 'critical'
  if (importers >= 20) return 'high'
  if (importers >= 10) return 'medium'
  return 'low'
}

/** Parse the hub files table from the report markdown. */
function parseHubSection(lines: string[]): CodegraphHub[] {
  const result: CodegraphHub[] = []
  let inSection = false

  for (const line of lines) {
    if (line.startsWith('## Hub Files')) {
      inSection = true
      continue
    }
    if (inSection && (line.startsWith('## ') || line.startsWith('>'))) {
      break
    }
    // Table row: | 1 | `lib/types.ts` | **72** |
    const match = line.match(/^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|\s*\*{0,2}(\d+)\*{0,2}\s*\|/)
    if (match) {
      const file = match[1]
      const importers = parseInt(match[2], 10)
      result.push({ file, importers, risk: computeRisk(importers) })
    }
  }

  return result
}

/** Parse the high fan-out files section from the report markdown. */
function parseFanOutSection(lines: string[]): string[] {
  const result: string[] = []
  let inSection = false

  for (const line of lines) {
    if (line.startsWith('## High Fan-Out Files')) {
      inSection = true
      continue
    }
    if (inSection && (line.startsWith('## ') || line.startsWith('>'))) {
      break
    }
    // Table row: | `app/api/team-chat/route.ts` | 19 |
    const match = line.match(/^\|\s*`([^`]+)`\s*\|/)
    if (match) {
      result.push(match[1])
    }
  }

  return result
}

/** Parse the API route dependency map from the report markdown. */
function parseApiDepsSection(lines: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  let currentRoute: string | null = null
  let inSection = false

  for (const line of lines) {
    if (line.startsWith('## API Route Dependency Map')) {
      inSection = true
      continue
    }
    if (inSection && (line.startsWith('## ') || line.startsWith('---'))) {
      break
    }

    // Route header: **`app/api/team-chat/route.ts`** (19 deps)
    const routeMatch = line.match(/\*\*`([^`]+)`\*\*\s*\(\d+\s*deps?\)/)
    if (routeMatch) {
      currentRoute = routeMatch[1]
      result[currentRoute] = []
      continue
    }

    // Dependency line:   → `lib/agents.ts`
    if (currentRoute) {
      const depMatch = line.match(/→\s*`([^`]+)`/)
      if (depMatch) {
        result[currentRoute].push(depMatch[1])
      }
    }
  }

  return result
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Read and parse the CODEGRAPH_REPORT.md file.
 * Results are cached in-memory; re-reads only if mtime changes.
 */
export function getCodegraphReport(): CodegraphReport {
  if (!existsSync(REPORT_PATH)) {
    return { hubFiles: [], fanOutFiles: [], apiDeps: {} }
  }

  // Check cache freshness via mtime
  try {
    const { mtimeMs } = statSync(REPORT_PATH)
    if (cachedReport && cachedMtime >= mtimeMs) {
      return cachedReport
    }
    cachedMtime = mtimeMs
  } catch {
    // If stat fails, continue to parse fresh
  }

  const raw = readFileSync(REPORT_PATH, 'utf-8')
  const lines = raw.split('\n')

  const hubFiles = parseHubSection(lines)
  const fanOutFiles = parseFanOutSection(lines)
  const apiDeps = parseApiDepsSection(lines)

  cachedReport = { hubFiles, fanOutFiles, apiDeps }
  return cachedReport
}

// ─── Query: Match files against hub files ────────────────────────────────────

/**
 * Match a list of file paths against the codegraph hub files.
 * Returns up to 5 results in TOON format: 'D|hub|file|count|risk'
 *
 * Matching is fuzzy: a hub file is considered a match if any input
 * file path contains or is contained by the hub file path, ignoring
 * leading path segments and extensions.
 */
export function queryCodegraph(filePaths: string[]): string {
  const { hubFiles } = getCodegraphReport()

  if (filePaths.length === 0 || hubFiles.length === 0) {
    return ''
  }

  // Score each hub file against the input set
  const scored = hubFiles.map(hub => {
    let score = 0
    for (const fp of filePaths) {
      // Exact match
      if (fp === hub.file || hub.file === fp) {
        score += 100
        continue
      }
      // One contains the other
      if (fp.includes(hub.file) || hub.file.includes(fp)) {
        score += 50
        continue
      }
      // Filename match (last segment)
      const fpName = fp.split('/').pop() ?? fp
      const hubName = hub.file.split('/').pop() ?? hub.file
      if (fpName === hubName) {
        score += 30
        continue
      }
      // Partial filename match (one contains the other without extension)
      const fpStem = fpName.replace(/\.[^.]+$/, '')
      const hubStem = hubName.replace(/\.[^.]+$/, '')
      if (fpStem.includes(hubStem) || hubStem.includes(fpStem)) {
        score += 15
      }
    }
    return { hub, score }
  })

  // Sort by score descending, then by importers descending as tiebreaker
  scored.sort((a, b) => b.score - a.score || b.hub.importers - a.hub.importers)

  // Take top 5 with score > 0
  const hits = scored.filter(s => s.score > 0).slice(0, 5)

  if (hits.length === 0) return ''

  return hits
    .map(({ hub }) => `D|hub|${hub.file}|${hub.importers}|${hub.risk}`)
    .join('\n')
}

// ─── Query: Blast Radius via BFS ─────────────────────────────────────────────

/**
 * Find all API routes that depend on a given file, using BFS through
 * the apiDeps dependency graph. Returns an array of route file paths
 * sorted by dependency depth (direct first, then transitive).
 *
 * Handles missing/misspelled files gracefully — returns an empty
 * array if the file is not found anywhere in the dependency graph.
 */
export function queryBlastRadius(file: string): string[] {
  const { apiDeps } = getCodegraphReport()

  if (!file || Object.keys(apiDeps).length === 0) {
    return []
  }

  // Build reverse dependency graph: dep → [routes that import it]
  const reverseGraph: Record<string, string[]> = {}
  for (const [route, deps] of Object.entries(apiDeps)) {
    for (const dep of deps) {
      if (!reverseGraph[dep]) reverseGraph[dep] = []
      reverseGraph[dep].push(route)
    }
  }

  // If the exact file isn't in the reverse graph, try fuzzy matching
  let startNode = file
  if (!reverseGraph[startNode]) {
    // Try to find a matching key in the reverse graph
    const candidates = Object.keys(reverseGraph).filter(
      k => k.includes(file) || file.includes(k),
    )
    if (candidates.length === 0) {
      return [] // Graceful: no matches found
    }
    // Use the first match (typically the best match in a flat namespace)
    startNode = candidates[0]
  }

  // BFS through the reverse graph (dependents of dependents)
  const visited = new Set<string>()
  const queue: string[] = [startNode]
  const result: string[] = []

  // Don't include the start file itself in results (it's the query target)
  visited.add(startNode)

  while (queue.length > 0) {
    const current = queue.shift()!

    for (const dependent of reverseGraph[current] ?? []) {
      if (!visited.has(dependent)) {
        visited.add(dependent)
        result.push(dependent)
        queue.push(dependent)
      }
    }
  }

  return result
}

// ─── Utility: Invalidate cache ────────────────────────────────────────────────

/** Force re-read of the report on the next call. Useful after codegraph rebuild. */
export function invalidateCodegraphCache(): void {
  cachedReport = null
  cachedMtime = 0
}
