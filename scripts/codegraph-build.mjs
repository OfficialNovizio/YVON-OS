#!/usr/bin/env node
/**
 * codegraph-build.mjs
 * Import-based dependency graph for the YVON codebase.
 * Replaces the non-existent `code-review-graph` npm package.
 *
 * Output: graphify-out/CODEGRAPH_REPORT.md
 * Run:    npm run codegraph:build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '.toon', 'codegraph', 'CODEGRAPH_REPORT.md');

// ── Config ─────────────────────────────────────────────────────────────────

const SCAN_DIRS = ['app', 'lib', 'src'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.toon', '.git', '__tests__', 'public']);
const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

// ── File walker ─────────────────────────────────────────────────────────────

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (CODE_EXTS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

// ── Import extraction ───────────────────────────────────────────────────────

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;
const REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractImports(content) {
  const found = [];
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content))) found.push(m[1]);
  REQUIRE_RE.lastIndex = 0;
  while ((m = REQUIRE_RE.exec(content))) found.push(m[1]);
  return found.filter(i => i.startsWith('.') || i.startsWith('@/') || i.startsWith('~/'));
}

function resolveImport(imp, fromFile) {
  if (imp.startsWith('@/')) return path.join(ROOT, imp.slice(2));
  if (imp.startsWith('~/')) return path.join(ROOT, imp.slice(2));
  return path.resolve(path.dirname(fromFile), imp);
}

const RESOLVE_SUFFIXES = [
  '', '.ts', '.tsx', '.js', '.jsx',
  '/index.ts', '/index.tsx', '/index.js', '/index.jsx',
];

function findFile(resolved) {
  for (const s of RESOLVE_SUFFIXES) {
    const c = resolved + s;
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

// ── Build graph ─────────────────────────────────────────────────────────────

const allFiles = [];
for (const d of SCAN_DIRS) walk(path.join(ROOT, d), allFiles);

/** file → Set<file it imports> */
const deps = new Map(allFiles.map(f => [f, new Set()]));
/** file → Set<file that imports it> */
const rdeps = new Map(allFiles.map(f => [f, new Set()]));

for (const file of allFiles) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const imp of extractImports(content)) {
    const actual = findFile(resolveImport(imp, file));
    if (actual && deps.has(actual)) {
      deps.get(file).add(actual);
      rdeps.get(actual).add(file);
    }
  }
}

// ── Analysis ────────────────────────────────────────────────────────────────

// Hub files: most imported (highest impact if changed)
const hubs = [...rdeps.entries()]
  .map(([f, importers]) => ({ f, n: importers.size }))
  .filter(x => x.n > 0)
  .sort((a, b) => b.n - a.n)
  .slice(0, 15);

// High fan-out: files that import the most others (coupling risk)
const fanOut = [...deps.entries()]
  .map(([f, d]) => ({ f, n: d.size }))
  .filter(x => x.n > 3)
  .sort((a, b) => b.n - a.n)
  .slice(0, 12);

// API routes → their lib dependencies
const apiRoutes = allFiles
  .filter(f => (f.includes('/api/') || f.includes('\\api\\')) && f.endsWith('route.ts'))
  .map(route => ({
    route: rel(route),
    deps: [...(deps.get(route) || [])].map(rel),
  }))
  .filter(x => x.deps.length > 0)
  .sort((a, b) => b.deps.length - a.deps.length)
  .slice(0, 15);

// Orphan files (not imported by anything — safe to delete if unused)
const apiOrPagePattern = /[/\\](api|page\.|layout\.|middleware|config)/;
const orphans = allFiles.filter(f => {
  return (
    rdeps.get(f)?.size === 0 &&
    !apiOrPagePattern.test(f) &&
    !f.endsWith('.d.ts')
  );
}).map(rel);

// Detect cycles (DFS — only report top 5)
const cycles = [];
function dfs(start, node, visited, path) {
  if (cycles.length >= 5) return;
  for (const next of deps.get(node) || []) {
    if (next === start) { cycles.push([...path, rel(next)]); return; }
    if (!visited.has(next)) {
      visited.add(next);
      dfs(start, next, visited, [...path, rel(next)]);
    }
  }
}
for (const f of allFiles.slice(0, 60)) {
  if (cycles.length >= 5) break;
  dfs(f, f, new Set([f]), [rel(f)]);
}

// ── Render ──────────────────────────────────────────────────────────────────

const date = new Date().toISOString().split('T')[0];
const totalEdges = [...deps.values()].reduce((s, v) => s + v.size, 0);

const lines = [
  `# Code Dependency Graph — YVON (${date})`,
  `> ${allFiles.length} files · ${totalEdges} import edges`,
  `> Rebuild: \`npm run codegraph:build\``,
  '',
  '---',
  '',
  '## Hub Files — Most Imported (highest blast radius)',
  '',
  '| # | File | Importers |',
  '|---|------|-----------|',
  ...hubs.map((h, i) => `| ${i + 1} | \`${rel(h.f)}\` | **${h.n}** |`),
  '',
  '> Changing a hub file affects every importer. Always check rdeps before editing.',
  '',
  '---',
  '',
  '## High Fan-Out Files — Most Imports (coupling risk)',
  '',
  '| File | Imports |',
  '|------|---------|',
  ...fanOut.map(f => `| \`${rel(f.f)}\` | ${f.n} |`),
  '',
  '> High fan-out = high coupling. If this file changes, many things break.',
  '',
  '---',
  '',
  '## API Route Dependency Map',
  '',
  ...apiRoutes.flatMap(({ route, deps: d }) => [
    `**\`${route}\`** (${d.length} deps)`,
    ...d.map(dep => `  → \`${dep}\``),
    '',
  ]),
  '',
  '---',
  '',
  '## Potentially Orphaned Files',
  '',
  orphans.length > 0
    ? ['> Not imported by any other file — verify before deleting.', '',
        ...orphans.map(f => `- \`${f}\``),
      ].join('\n')
    : '_None found._',
  '',
  '---',
  '',
  ...(cycles.length > 0 ? [
    '## ⚠️ Circular Dependencies Detected',
    '',
    ...cycles.map((c, i) => `${i + 1}. ${c.join(' → ')}`),
    '',
    '---',
    '',
  ] : []),
  `_Generated by \`scripts/codegraph-build.mjs\` on ${date}_`,
];

fs.writeFileSync(OUT, lines.join('\n'));

console.log(`✓ CODEGRAPH_REPORT.md written → .toon/codegraph/`);
console.log(`  ${allFiles.length} files · ${totalEdges} edges · ${hubs.length} hubs · ${apiRoutes.length} API routes · ${orphans.length} orphans`);
if (cycles.length > 0) console.warn(`  ⚠️  ${cycles.length} circular dependencies detected — see report`);
