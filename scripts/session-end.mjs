#!/usr/bin/env node
/**
 * Fires on Claude Code Stop hook.
 * 1. Writes "## Last Clean Exit: YYYY-MM-DD HH:MM" to docs/os/SESSION.md.
 * 2. If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are available (dev only),
 *    queries today's agent_sessions and prepends a new row to the Last 5 Sessions table.
 */
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root        = join(dirname(fileURLToPath(import.meta.url)), '..');
const sessionPath = join(root, 'docs/os/SESSION.md');

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

// ─── Load env from .env.local if available ──────────────────────────────────
function loadEnvLocal() {
  try {
    const envPath = join(root, '.env.local');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env.local — skip */ }
}
loadEnvLocal();

const AGENT_LABELS = {
  'marcus-ceo':         'Marcus',
  'diana-coo':          'Diana',
  'dev-lead':           'Dev',
  'raj-backend':        'Raj',
  'mia-frontend':       'Mia',
  'quinn-qa':           'Quinn',
  'kai-analyst':        'Kai',
  'lena-brand':         'Lena',
  'rio-ads':            'Rio',
  'nate-growth':        'Nate',
  'atlas-art-director': 'Atlas',
  'pixel-production':   'Pixel',
  'felix-finance':      'Felix',
};

const TABLE_HEADER = '| Date | Agent(s) | Task | Outcome | Next Step |';

function injectSessionRow(content, newRow) {
  const headerIdx = content.indexOf(TABLE_HEADER);
  if (headerIdx === -1) return content;
  const separatorEnd = content.indexOf('\n', content.indexOf('\n', headerIdx) + 1);
  if (separatorEnd === -1) return content;

  const before = content.slice(0, separatorEnd + 1);
  const after  = content.slice(separatorEnd + 1);

  const existingRows = after.split('\n').filter(l => l.startsWith('|'));
  const allRows = [newRow, ...existingRows].slice(0, 5);

  const restLines   = after.split('\n');
  const firstNonRow = restLines.findIndex(l => !l.startsWith('|') && l.trim() !== '');
  const rest        = firstNonRow === -1 ? '' : '\n' + restLines.slice(firstNonRow).join('\n');

  return before + allRows.join('\n') + rest;
}

async function fetchTodaySessions() {
  const url  = process.env.SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === 'placeholder') return null;

  const todayStart = new Date(today + 'T00:00:00.000Z').toISOString();
  const apiUrl = `${url}/rest/v1/agent_sessions?select=agent_id,task,outcome&created_at=gte.${todayStart}&order=created_at.desc`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

(async () => {
  let content = readFileSync(sessionPath, 'utf8');

  // Step 1 — update Last Clean Exit timestamp
  content = content.replace(
    /^## Last Clean Exit:.*$/m,
    `## Last Clean Exit: ${timestamp}`
  );

  // Step 2 — try to inject a session row from Supabase
  const rows = await fetchTodaySessions();
  if (rows && rows.length > 0) {
    const agentSet = new Set();
    rows.forEach(r => agentSet.add(AGENT_LABELS[r.agent_id] ?? r.agent_id));
    const agents = [...agentSet].join(', ');

    const taskSet = new Set();
    rows.forEach(r => { if (r.task) taskSet.add(r.task.slice(0, 55)); });
    const tasks = [...taskSet].slice(0, 3).join('; ') || 'Live agent activity';

    const outcome  = `${rows.length} agent call${rows.length !== 1 ? 's' : ''} via War Room`;
    const nextStep = 'Review CEO dashboard';
    const newRow   = `| ${today} | ${agents} | ${tasks} | ${outcome} | ${nextStep} |`;

    content = injectSessionRow(content, newRow);
  }

  writeFileSync(sessionPath, content, 'utf8');

  // Rebuild knowledge graph (AST-only — no API cost, ~3 seconds)
  try {
    execSync('npm run graphify:build --silent', { cwd: root, stdio: 'ignore', timeout: 60000 });
  } catch { /* non-fatal — graph rebuild failure never blocks session end */ }

  // Output ADJOURNING reminder so Claude sees it as a system-reminder next turn
  const reminder = [
    'ADJOURNING CHECKLIST (run if this session had ≥3 tool calls):',
    '1. POST /api/agent-session-memory { agentId, venture, summary, learnings[], corrections[], filesChanged[], toolCallsCount }',
    '2. Append learning to agent MEMORY.md via POST /api/agent-memory { agentId, content }',
    '3. Run 3-question self-improvement check (docs/reference/SELF-IMPROVEMENT.md)',
    '4. Update docs/os/SESSION.md Last 5 Sessions table (one unique row — no duplicates)',
    '5. Write ## Last Clean Exit timestamp',
    'Graph rebuilt automatically by session-end hook.',
  ].join(' | ');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: reminder,
    },
  }) + '\n');
})();
