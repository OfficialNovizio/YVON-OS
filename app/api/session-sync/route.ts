import { supabase } from '@/lib/supabase'
import { getSecret } from '@/lib/secrets'

const GH_API   = 'https://api.github.com'
const SESSION_PATH = 'docs/os/SESSION.md'

// Agent display names
const AGENT_LABELS: Record<string, string> = {
  'marcus-ceo':    'Marcus',
  'diana-coo':     'Diana',
  'dev-lead':      'Dev',
  'raj-backend':   'Raj',
  'mia-frontend':  'Mia',
  'quinn-qa':      'Quinn',
  'kai-analyst':   'Kai',
  'lena-brand':    'Lena',
  'rio-ads':       'Rio',
  'nate-growth':   'Nate',
  'atlas-art-director': 'Atlas',
  'pixel-production':   'Pixel',
  'felix-finance':  'Felix',
}

interface AgentSessionRow {
  agent_id: string
  venture: string
  task: string
  outcome: string
  duration_ms: number | null
  created_at: string
}

interface SyncSummary {
  date: string
  sessionCount: number
  agents: string[]
  tasks: string[]
  markdownRow: string
}

function buildSummary(rows: AgentSessionRow[]): SyncSummary {
  const today = new Date().toISOString().slice(0, 10)

  // Deduplicate agents
  const agentSet = new Set<string>()
  rows.forEach(r => agentSet.add(AGENT_LABELS[r.agent_id] ?? r.agent_id))
  const agents = [...agentSet]

  // Collect unique task summaries (deduplicate + truncate)
  const taskSet = new Set<string>()
  rows.forEach(r => { if (r.task) taskSet.add(r.task.slice(0, 60)) })
  const tasks = [...taskSet].slice(0, 4)

  // Build a markdown table row — columns: Date | Agent(s) | Task | Outcome | Next Step
  const agentCell  = agents.join(', ')
  const taskCell   = tasks.join('; ').slice(0, 80) || 'Live agent activity'
  const outcomeCell = `${rows.length} agent call${rows.length !== 1 ? 's' : ''} logged`
  const nextCell   = 'Review via CEO dashboard → System → Session Sync'

  const markdownRow = `| ${today} | ${agentCell} | ${taskCell} | ${outcomeCell} | ${nextCell} |`

  return { date: today, sessionCount: rows.length, agents, tasks, markdownRow }
}

function injectSessionRow(content: string, newRow: string): string {
  // Insert the new row right after the table header + separator lines in "Last 5 Sessions"
  const tableHeader = '| Date | Agent(s) | Task | Outcome | Next Step |'
  const headerIdx = content.indexOf(tableHeader)
  if (headerIdx === -1) return content

  // Find the separator line (|---| row) after the header
  const separatorEnd = content.indexOf('\n', content.indexOf('\n', headerIdx) + 1)
  if (separatorEnd === -1) return content

  const before = content.slice(0, separatorEnd + 1)
  const after  = content.slice(separatorEnd + 1)

  // Inject the new row, then trim to keep only 5 rows
  const allRows = [newRow, ...after.split('\n').filter(l => l.startsWith('|'))].slice(0, 5)

  // Rebuild: keep whatever was after the table rows too
  const restLines = after.split('\n')
  const firstNonRow = restLines.findIndex(l => !l.startsWith('|') && l.trim() !== '')
  const rest = firstNonRow === -1 ? '' : '\n' + restLines.slice(firstNonRow).join('\n')

  return before + allRows.join('\n') + rest
}

// ─── GET — return today's session summary ────────────────────────────────────

export async function GET(): Promise<Response> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('agent_id, venture, task, outcome, duration_ms, created_at')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as AgentSessionRow[]
  if (rows.length === 0) return Response.json({ sessionCount: 0, agents: [], tasks: [], markdownRow: null })

  return Response.json(buildSummary(rows))
}

// ─── POST — sync today's summary into SESSION.md via GitHub ──────────────────

export async function POST(): Promise<Response> {
  const ghToken = await getSecret('GITHUB_TOKEN')
  const ghOwner = await getSecret('YVON_GITHUB_OWNER')
  const ghRepo  = await getSecret('YVON_GITHUB_REPO')
  if (!ghToken) return Response.json({ error: 'GITHUB_TOKEN not set' }, { status: 503 })
  if (!ghOwner || !ghRepo) return Response.json({ error: 'YVON_GITHUB_OWNER / YVON_GITHUB_REPO not set' }, { status: 503 })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('agent_sessions')
    .select('agent_id, venture, task, outcome, duration_ms, created_at')
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []) as AgentSessionRow[]
  if (rows.length === 0) return Response.json({ skipped: true, reason: 'No agent sessions today' })

  const summary = buildSummary(rows)

  // 1. Fetch current SESSION.md from GitHub to get its SHA
  const ghHeaders = {
    Authorization: `Bearer ${ghToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'YVON-OS/1.0',
  }

  const fileRes = await fetch(`${GH_API}/repos/${ghOwner}/${ghRepo}/contents/${SESSION_PATH}`, { headers: ghHeaders })
  if (!fileRes.ok) {
    const text = await fileRes.text()
    return Response.json({ error: `GitHub GET failed: ${fileRes.status} ${text}` }, { status: 502 })
  }
  const fileData = await fileRes.json() as { content: string; sha: string }
  const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8')

  // 2. Build updated content
  const updatedContent = injectSessionRow(currentContent, summary.markdownRow)
  if (updatedContent === currentContent) {
    return Response.json({ skipped: true, reason: 'Table header not found in SESSION.md' })
  }

  // 3. Write back
  const putRes = await fetch(`${GH_API}/repos/${ghOwner}/${ghRepo}/contents/${SESSION_PATH}`, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `chore: sync agent session log ${summary.date} (${summary.sessionCount} calls)`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: fileData.sha,
    }),
  })

  if (!putRes.ok) {
    const text = await putRes.text()
    return Response.json({ error: `GitHub PUT failed: ${putRes.status} ${text}` }, { status: 502 })
  }

  return Response.json({ synced: true, date: summary.date, sessionCount: summary.sessionCount, agents: summary.agents })
}
