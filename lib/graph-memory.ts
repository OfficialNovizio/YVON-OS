/**
 * lib/graph-memory.ts — venture-code "graph memory" (C-graph).
 *
 * Agents query this BEFORE editing a symbol or file to find every reference /
 * call site across the venture repo — so a rename/extraction updates ALL
 * dependents instead of half of them. This directly targets the class of bug
 * that shipped 7 compile errors (e.g. `buildOverviewForMonth` extracted but its
 * callers left dangling; `shiftRepo` added to a call site but not the ctor).
 *
 * Cross-platform: pure Node fs walk (no shell, no prebuilt graph, no Windows-only
 * graphify CLI). Always current — it reads the live repo. macOS + Windows alike.
 */
import { promises as fs } from 'fs'
import { resolve, relative, sep } from 'path'

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.dart_tool', 'build', '.next', 'dist',
  '.idea', '.vscode', 'android', 'ios', '.toon/codegraph', '.toon/graphify', '.code-review-graph',
])
const CODE_EXT = /\.(dart|kt|kts|java|swift|ts|tsx|js|jsx|py|go|rb|rs|c|cc|cpp|h|hpp|cs|php|vue|svelte)$/i
const MAX_FILES = 4000
const MAX_HITS = 200

export interface GraphHit { file: string; line: number; text: string }
export interface GraphImpact {
  target: string
  count: number
  fileCount: number
  hits: GraphHit[]
  truncated: boolean
}

async function walk(root: string, out: string[]): Promise<void> {
  if (out.length >= MAX_FILES) return
  let entries
  try { entries = await fs.readdir(root, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    if (out.length >= MAX_FILES) return
    if (e.name.startsWith('.') && e.name !== '.') continue
    const full = resolve(root, e.name)
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      await walk(full, out)
    } else if (e.isFile() && CODE_EXT.test(e.name)) {
      out.push(full)
    }
  }
}

/**
 * Find every reference to `target` (a symbol, identifier, or filename stem)
 * across the repo. Word-boundary matched so "Shift" doesn't match "Shifting".
 */
export async function queryImpact(repoRoot: string, target: string): Promise<GraphImpact> {
  const files: string[] = []
  await walk(repoRoot, files)

  // Escape regex special chars, then word-boundary the identifier.
  const esc = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${esc}\\b`)

  const hits: GraphHit[] = []
  const fileSet = new Set<string>()
  let total = 0
  for (const f of files) {
    if (hits.length >= MAX_HITS) break
    let text: string
    try { text = await fs.readFile(f, 'utf8') } catch { continue }
    if (!re.test(text)) continue
    const rel = relative(repoRoot, f).split(sep).join('/')
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        total++
        fileSet.add(rel)
        if (hits.length < MAX_HITS) hits.push({ file: rel, line: i + 1, text: lines[i].trim().slice(0, 200) })
      }
    }
  }

  return { target, count: total, fileCount: fileSet.size, hits, truncated: total > hits.length }
}

/** Format impact results into an agent-readable block. */
export function formatImpact(r: GraphImpact): string {
  if (r.count === 0) return `No references to "${r.target}" found in the repo. (If you're about to create it, this confirms it's new.)`
  const byFile = new Map<string, GraphHit[]>()
  for (const h of r.hits) {
    const list = byFile.get(h.file) ?? []
    list.push(h); byFile.set(h.file, list)
  }
  const blocks = [...byFile.entries()].map(([file, hs]) =>
    `${file} (${hs.length})\n${hs.map(h => `  L${h.line}: ${h.text}`).join('\n')}`,
  )
  const header = `"${r.target}" — ${r.count} reference(s) across ${r.fileCount} file(s)${r.truncated ? ' (truncated)' : ''}.\n` +
    `⛔ If you change/rename/move "${r.target}", update EVERY file below or the build breaks.\n`
  return header + '\n' + blocks.join('\n\n')
}
