#!/usr/bin/env node
/**
 * graphify-postprocess.mjs
 * Runs immediately after `graphify update .` to rewrite GRAPH_REPORT.md
 * into a compact, semantically-named version Claude can use efficiently.
 *
 * Chained via: npm run graphify:build
 * Output: graphify-out/GRAPH_REPORT.md (replaces graphify's verbose version)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const GRAPH_JSON = path.join(ROOT, '.toon', 'graphify', 'graph.json');
const REPORT_OUT = path.join(ROOT, '.toon', 'graphify', 'GRAPH_REPORT.md');

if (!fs.existsSync(GRAPH_JSON)) {
  console.error('graph.json not found — run graphify:build first');
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(GRAPH_JSON, 'utf8'));
const nodes = graph.nodes || [];
const links = graph.links || [];

// ── Community grouping ──────────────────────────────────────────────────────

const communityMap = new Map(); // community id → [node labels]
for (const node of nodes) {
  const cid = node.community ?? -1;
  if (!communityMap.has(cid)) communityMap.set(cid, []);
  communityMap.get(cid).push(node.label || node.norm_label || '?');
}

// ── Semantic naming ─────────────────────────────────────────────────────────
// Rules: if any node in the community matches a keyword pattern, use that name.
// First match wins. Fall back to "Misc / Config".

const SEMANTIC_RULES = [
  [/monitor|errortrack|routingfeedback/i,        'Monitoring & Error Tracking'],
  [/findmemory|migrateMemory|getDepartment|flagSIP|readSession/i, 'Memory & Session Ops'],
  [/appendDailyLog|createBrief|createTask|createVenture|createDecision|createDeliverable/i, 'Database Operations'],
  [/logActivity|streamMessage|generateVariants|replanEntry/i, 'Activity & Stream Layer'],
  [/generateWithKrea|generateCaptions|generateImage|generateScripts/i, 'AI Creative Generation'],
  [/resolveThresholds/i,                         'API Threshold Layer'],
  [/initializeSeed|regenerate|setup|Entity/i,    'Database Seeds'],
  [/createAnomaly|createRevenue|getAudience|getRevenue|getAttribution/i, 'Revenue & Analytics Events'],
  [/SkillsManager/i,                             'Skills System'],
  [/getActiveTab|setScrollPos|isBrowser|clearAll/i, 'Client Storage / UI State'],
  [/calculateRouting|ConflictResolver|HandoffManager|canActAut/i, 'Agent Routing Engine'],
  [/flagSIP|calculateSip|generateSip|getSipPriority/i, 'SIP Protocol'],
  [/runInstagram|runLinkedIn|runWebScraper|scrapeTikTok/i, 'Social Media Scrapers'],
  [/getCompetitors|identifyUnclaimed|upsertTerritory/i, 'Competitor Intelligence'],
  [/getAgent|buildSystemPrompt|routeToAgent|getSpecialist/i, 'Agent Dispatch'],
  [/classifyIntent|gatekeep|validateContext|generateReason/i, 'Gatekeeper'],
  [/archiveOldEntries|optimizeMemory|enforceSectionCaps|batchOptimize/i, 'Memory Optimization'],
  [/safePath|sbGet|sbPost|sbPatch|supabaseHeaders/i, 'Supabase Client Layer'],
  [/migrateSession|parseSession|validateSession/i, 'Session Migration'],
  [/deleteAgent|deleteContent|DELETE/i,           'Delete Operations'],
  [/getArchiveRec|getContentScores|detectPurchase/i, 'Content Scoring'],
  [/runViaManagement|runViaPgMeta|runViaSupabase/i, 'DB Migration Tools'],
  [/is_server_ready/i,                            'Server Health Check'],
  [/enrichScoreCard/i,                            'Score Cards'],
  [/getBrandDNA|saveBrandDNA/i,                   'Brand DNA'],
  [/getProject/i,                                 'Project Context'],
  [/getCommunitySignals|upsertCommunity/i,        'Community Signals'],
  [/combineGraphs|extractDot|renderToSvg/i,       'Graph Visualization'],
  [/collaboration|HandoffManager/i,               'Agent Collaboration'],
];

function nameCommunity(labels) {
  const joined = labels.join(' ');
  for (const [pattern, name] of SEMANTIC_RULES) {
    if (pattern.test(joined)) return name;
  }
  return null; // returns null for unnamed/empty communities
}

// ── Node degree (edge count) ────────────────────────────────────────────────

const degree = new Map();
for (const link of links) {
  degree.set(link.source, (degree.get(link.source) || 0) + 1);
  degree.set(link.target, (degree.get(link.target) || 0) + 1);
}

// God nodes: top 8 by degree, excluding generic POST/GET handlers
const godNodes = nodes
  .map(n => ({ label: n.label, edges: degree.get(n.id) || 0 }))
  .filter(n => n.edges > 5 && !/^(POST|GET|DELETE|PATCH|PUT)\(\)$/.test(n.label))
  .sort((a, b) => b.edges - a.edges)
  .slice(0, 8);

// ── Build community table ───────────────────────────────────────────────────

const namedCommunities = [];
let skipped = 0;

for (const [cid, labels] of [...communityMap.entries()].sort((a, b) => a[0] - b[0])) {
  if (labels.length < 2) { skipped++; continue; } // skip singletons
  const name = nameCommunity(labels);
  if (!name) { skipped++; continue; } // skip unnamed noise clusters
  const sample = labels.filter(l => !/(page\.tsx|layout\.tsx|\.config\.|\.d\.ts)/.test(l)).slice(0, 4);
  namedCommunities.push({ cid, name, count: labels.length, sample });
}

// ── Stats ───────────────────────────────────────────────────────────────────

const date = new Date().toISOString().split('T')[0];
const totalNodes = nodes.length;
const totalEdges = links.length;
const totalCommunities = communityMap.size;

// ── Render ──────────────────────────────────────────────────────────────────

const lines = [
  `# Graph Report — YVON (${date})`,
  `> **${totalNodes} nodes · ${totalEdges} edges · ${namedCommunities.length} named communities** (${skipped} singleton/config clusters excluded)`,
  `> Rebuild: \`npm run graphify:build\` | Query: \`npm run graphify:query -- "question"\``,
  '',
  '---',
  '',
  '## God Nodes (highest impact — most connections)',
  '',
  '| Rank | Node | Edges | Note |',
  '|------|------|-------|------|',
  ...godNodes.map((n, i) => `| ${i + 1} | \`${n.label}\` | ${n.edges} | — |`),
  '',
  '> `POST()` / `GET()` have 90–100 edges but are generic handler names — actual call sites may be fewer.',
  '',
  '---',
  '',
  '## Named Communities',
  '',
  '| # | Community | Nodes | Key Functions |',
  '|---|-----------|-------|---------------|',
  ...namedCommunities.map(c =>
    `| ${c.cid} | **${c.name}** | ${c.count} | ${c.sample.join(', ')} |`
  ),
  '',
  '---',
  '',
  '## Architecture Flow',
  '',
  '```',
  'User request',
  '  → /api/* route handler  [API Threshold Layer]',
  '  → verifyVenture()       [God Node]',
  '  → Gatekeeper            → Agent Dispatch → Agent Routing Engine',
  '  → Database Operations   → Supabase Client Layer',
  '  → Monitoring & Error Tracking  (all paths report here)',
  '```',
  '',
  '**AI Creative pipeline:**',
  '`AI Creative Generation` ← `Social Media Scrapers` → `Revenue & Analytics Events` → `Brand DNA`',
  '',
  '**Memory pipeline:**',
  '`Memory & Session Ops` → `Memory Optimization` → `Client Storage / UI State`',
  '',
  '---',
  '',
  '## Codegraph (Import Dependency Map)',
  '',
  'See `.toon/codegraph/CODEGRAPH_REPORT.md` for file-level import analysis.',
  'Rebuild: `npm run codegraph:build`',
];

fs.writeFileSync(REPORT_OUT, lines.join('\n'));
console.log(`✓ GRAPH_REPORT.md rewritten — ${namedCommunities.length} named communities, ${skipped} noise clusters pruned`);
