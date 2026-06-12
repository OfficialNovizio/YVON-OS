// lib/cie/sources/graphify.ts — Graphify report parser and query engine
//
// Reads /root/yvon/graphify-out/GRAPH_REPORT.md and provides:
//   getGraphifyReport() → { communities: GraphifyCommunity[] }
//   queryGraphify(keywords: string[]) → top-3 TOON-dense string
//
// TOON format: 'G|name|cohesion|matched_node1,matched_node2'

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

import type { GraphifyCommunity } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_PATH = resolve('/root/yvon/graphify-out/GRAPH_REPORT.md')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphifyReport {
  communities: GraphifyCommunity[]
}

// ─── Report Loader / Parser ──────────────────────────────────────────────────

let cachedReport: GraphifyReport | null = null
let cachedMtime = 0

/**
 * Parse a single community block starting at `startIdx` in `lines`.
 *
 * Expected 3-line block:
 *   ### Community 12 - "Community 12"
 *   Cohesion: 0.16
 *   Nodes (18): bustProviderCache(), callFast(), callSynthesis() (+15 more)
 *
 * Empty communities:
 *   ### Community 23 - "Community 23"
 *   Cohesion: 0.33
 *   Nodes (0):
 */
function parseCommunityBlock(
  lines: string[],
  startIdx: number,
): GraphifyCommunity | null {
  // Line 0 — header: ### Community N - "name"
  const headerMatch = lines[startIdx].match(
    /^###\s+(Community\s+\d+)\s+-\s+"(.+)"$/,
  )
  if (!headerMatch) return null
  const name = headerMatch[2]

  // Line 1 — Cohesion: 0.XX
  if (startIdx + 1 >= lines.length) return null
  const cohesionMatch = lines[startIdx + 1].match(/^Cohesion:\s+([\d.]+)$/)
  if (!cohesionMatch) return null
  const cohesion = parseFloat(cohesionMatch[1])

  // Line 2 — Nodes (N): node(), node()…
  if (startIdx + 2 >= lines.length) return null
  const nodesLine = lines[startIdx + 2]
  const nodesMatch = nodesLine.match(/^Nodes\s*\(\d+\):\s*(.*)$/)
  if (!nodesMatch) return null

  const rawNodes = nodesMatch[1].trim()
  const nodes: string[] = []

  if (rawNodes.length > 0) {
    // Split on "(), " — each entry is "name()" possibly with "(+N more)" suffix
    rawNodes
      .split('(), ')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .forEach((s) => {
        // Remove trailing "()" and "(+N more)" suffix on the last token
        let cleaned = s.replace(/\(\)$/, '')
        cleaned = cleaned.replace(/\s*\(\+\d+\s+more\)$/, '')
        if (cleaned.length > 0) nodes.push(cleaned)
      })
  }

  return { name, cohesion, nodes }
}

/** Walk the raw report text and extract all communities. */
function parseCommunities(raw: string): GraphifyCommunity[] {
  const lines = raw.split('\n')
  const communities: GraphifyCommunity[] = []

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('### Community ')) continue
    const community = parseCommunityBlock(lines, i)
    if (community) {
      communities.push(community)
    }
    // Skip the 2 lines we just consumed as part of the block
    i += 2
  }

  return communities
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Read and parse the GRAPH_REPORT.md file.
 * Results are cached in-memory; re-reads only if mtime changes.
 * Returns empty communities when the file doesn't exist.
 */
export function getGraphifyReport(): GraphifyReport {
  if (!existsSync(REPORT_PATH)) {
    return { communities: [] }
  }

  // Check cache freshness via mtime
  try {
    const { mtimeMs } = require('fs').statSync(REPORT_PATH)
    if (cachedReport && cachedMtime >= mtimeMs) {
      return cachedReport
    }
    cachedMtime = mtimeMs
  } catch {
    // If stat fails, continue to parse fresh
  }

  const raw = readFileSync(REPORT_PATH, 'utf-8')
  const communities = parseCommunities(raw)

  cachedReport = { communities }
  return cachedReport
}

// ─── Query: Keyword → Community Matching ──────────────────────────────────────

/**
 * Score a community against keyword set.
 * Returns the count of distinct keywords that match at least one node
 * (case-insensitive substring match on node names).
 */
function scoreCommunity(
  community: GraphifyCommunity,
  keywordsLower: string[],
): number {
  let hits = 0
  const nodeLower = community.nodes.map((n) => n.toLowerCase())
  for (const kw of keywordsLower) {
    for (const node of nodeLower) {
      if (node.includes(kw)) {
        hits++
        break // count each keyword at most once per community
      }
    }
  }
  return hits
}

/**
 * Query the graphify knowledge graph with keywords.
 *
 * - Matches keywords against community node names (case-insensitive substring).
 * - Filters to communities with cohesion > 0.05.
 * - Returns top 3 by match count, formatted as TOON-dense:
 *
 *     G|name|cohesion|matched_node1,matched_node2
 *
 * - Returns empty string when nothing matches or the report is missing.
 */
export function queryGraphify(keywords: string[]): string {
  const { communities } = getGraphifyReport()

  if (communities.length === 0 || keywords.length === 0) return ''

  const keywordsLower = keywords.map((k) => k.toLowerCase().trim())
  const scored = communities
    .filter((c) => c.cohesion > 0.05)
    .map((c) => ({
      community: c,
      score: scoreCommunity(c, keywordsLower),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (scored.length === 0) return ''

  return scored
    .map(({ community }) => {
      const matched = community.nodes.filter((n) =>
        keywordsLower.some((kw) => n.toLowerCase().includes(kw)),
      )
      return `G|${community.name}|${community.cohesion}|${matched.join(',')}`
    })
    .join('\n')
}

// ─── Utility: Invalidate cache ────────────────────────────────────────────────

/** Force re-read of the report on the next call. Useful after graphify rebuild. */
export function invalidateGraphifyCache(): void {
  cachedReport = null
  cachedMtime = 0
}
