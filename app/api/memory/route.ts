import { promises as fs } from 'fs'
import path from 'path'
import { sessionManager, flagSIP } from '@/lib/session-manager'

// ── Agent → MEMORY.md path map ────────────────────────────────────────────────
// Resolved relative to the project root at runtime via process.cwd()
const AGENT_MEMORY_PATHS: Record<string, string> = {
  'marcus-ceo':         'departments/executive/marcus-ceo/MEMORY.md',
  'diana-coo':          'departments/executive/diana-coo/MEMORY.md',
  'alex-marketing-dir': 'departments/marketing/alex-marketing-dir/MEMORY.md',
  'sofia-social':       'departments/marketing/sofia-social/MEMORY.md',
  'lena-brand':         'departments/marketing/lena-brand/MEMORY.md',
  'rio-ads':            'departments/marketing/rio-ads/MEMORY.md',
  'atlas-art-director': 'departments/marketing/atlas-art-director/MEMORY.md',
  'pixel-production':   'departments/marketing/pixel-production/MEMORY.md',
  'opus-creative-ops':  'departments/marketing/opus-creative-ops/MEMORY.md',
  'kai-analyst':        'departments/analytics/kai-analyst/MEMORY.md',
  'zara-competitor':    'departments/analytics/zara-competitor/MEMORY.md',
  'nate-growth':        'departments/analytics/nate-growth/MEMORY.md',
  'venture-scout':      'departments/analytics/venture-scout/MEMORY.md',
  'dev-lead':           'departments/technical/dev-lead/MEMORY.md',
  'raj-backend':        'departments/technical/raj-backend/MEMORY.md',
  'mia-frontend':       'departments/technical/mia-frontend/MEMORY.md',
  'priya-pm':           'departments/technical/priya-pm/MEMORY.md',
  'quinn-qa':           'departments/technical/quinn-qa/MEMORY.md',
  'leo-ui-designer':    'departments/technical/leo-ui-designer/MEMORY.md',
  'sam-planner':        'departments/operations/sam-planner/MEMORY.md',
  'felix-finance':      'departments/operations/felix-finance/MEMORY.md',
  'stark-growth':       'departments/personal/stark-growth/MEMORY.md',
}

const MAX_SESSION_LOG_ENTRIES = 50  // hard cap — oldest dropped beyond this

// ── GET — read an agent's recent session log ──────────────────────────────────
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')

  if (!agentId || !AGENT_MEMORY_PATHS[agentId]) {
    return Response.json({ error: 'Unknown agentId' }, { status: 400 })
  }

  try {
    const filePath = path.join(process.cwd(), AGENT_MEMORY_PATHS[agentId])
    const content = await fs.readFile(filePath, 'utf-8')

    // Extract session log section (lines matching [YYYY-MM-DD] pattern)
    const logLines = content
      .split('\n')
      .filter(l => /^\[20\d{2}-\d{2}-\d{2}\]/.test(l.trim()))
      .slice(-10)  // last 10 entries

    // Extract session_count if present
    const countMatch = content.match(/session_count:\s*(\d+)/)
    const sessionCount = countMatch ? parseInt(countMatch[1]) : 0

    // Check SIP due flag
    const sipDue = sessionCount > 0 && sessionCount % 5 === 0

    return Response.json({
      agentId,
      sessionCount,
      sipDue,
      recentLog: logLines,
    })
  } catch {
    return Response.json({ error: 'Could not read MEMORY.md' }, { status: 500 })
  }
}

// ── POST — append a session log entry to an agent's MEMORY.md ────────────────
export async function POST(request: Request): Promise<Response> {
  let body: { agentId?: string; entry?: string; task?: string; outcome?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId, entry, task, outcome } = body

  if (!agentId || !AGENT_MEMORY_PATHS[agentId]) {
    return Response.json({ error: 'Unknown agentId' }, { status: 400 })
  }

  // Build the log entry — accept either a pre-formatted entry or task+outcome
  const today = new Date().toISOString().slice(0, 10)
  let logLine: string
  if (entry) {
    logLine = entry.startsWith('[') ? entry : `[${today}] — ${entry}`
  } else if (task && outcome) {
    logLine = `[${today}] — ${task} — ${outcome}`
  } else {
    return Response.json({ error: 'Provide entry or task+outcome' }, { status: 400 })
  }

  // Sanitise — one line only, no newlines injected
  logLine = logLine.replace(/\n/g, ' ').slice(0, 300)

  try {
    const filePath = path.join(process.cwd(), AGENT_MEMORY_PATHS[agentId])
    let content = await fs.readFile(filePath, 'utf-8')

    // ── Append to Session Log section ────────────────────────────────────────
    // Look for a "## Session Log" or "## Completed Tasks" section to append to
    const sectionHeaders = ['## Session Log', '## Completed Tasks', '## Recent Sessions']
    let inserted = false

    for (const header of sectionHeaders) {
      if (content.includes(header)) {
        // Find the line after the header and insert there
        content = content.replace(
          header,
          `${header}\n${logLine}`
        )
        inserted = true
        break
      }
    }

    if (!inserted) {
      // Append a new Session Log section at the end
      content += `\n\n## Session Log\n${logLine}\n`
    }

    // ── Enforce MAX_SESSION_LOG_ENTRIES cap ───────────────────────────────────
    const allLogLines = content
      .split('\n')
      .filter(l => /^\[20\d{2}-\d{2}-\d{2}\]/.test(l.trim()))

    if (allLogLines.length > MAX_SESSION_LOG_ENTRIES) {
      // Remove the oldest entry (first matching line in file)
      const oldest = allLogLines[0]
      content = content.replace(oldest + '\n', '')
    }

    // ── Increment session_count ───────────────────────────────────────────────
    if (content.includes('session_count:')) {
      content = content.replace(
        /session_count:\s*(\d+)/,
        (_, n) => `session_count: ${parseInt(n) + 1}`
      )
    } else {
      // Add session_count to Status section if it exists, else top of file
      if (content.includes('## Status')) {
        content = content.replace('## Status', '## Status\nsession_count: 1')
      } else {
        content = `session_count: 1\n\n` + content
      }
    }

    await fs.writeFile(filePath, content, 'utf-8')

    // ── Check if SIP should be triggered ─────────────────────────────────────
    const countMatch = content.match(/session_count:\s*(\d+)/)
    const newCount = countMatch ? parseInt(countMatch[1]) : 0
    const sipDue = newCount > 0 && newCount % 5 === 0

    if (sipDue) {
      // Use new SessionManager to flag SIP
      try {
        await flagSIP(agentId, newCount)

        // Also update agent's MEMORY.md with scheduled flag
        const updatedContent = content.replace(
          '## Status',
          `## Status\n> ⚡ [SIP_SCHEDULED] Run SIP distillation (session ${newCount})`
        )
        await fs.writeFile(filePath, updatedContent, 'utf-8')
      } catch { /* non-fatal */ }
    }

    return Response.json({
      ok: true,
      agentId,
      entry: logLine,
      sessionCount: newCount,
      sipDue,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Write failed: ${msg}` }, { status: 500 })
  }
}
