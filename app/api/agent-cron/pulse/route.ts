import { NextRequest } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { callFast } from '@/lib/ai-client'
import { getAgentSessions } from '@/lib/db'

export const maxDuration = 60
import type { AgentId } from '@/lib/types'

// Quinn weekly Pulse — runs every Friday 17:00 via Vercel cron
// Spot-checks one output per department from this week's agent_sessions
// Scores Green/Yellow/Red, delivers report for Monday Marcus CEO brief

const DEPARTMENTS: Record<string, AgentId[]> = {
  CEO:        ['marcus-ceo', 'diana-coo'],
  Technical:  ['dev-lead', 'raj-backend', 'mia-frontend', 'quinn-qa'],
  Marketing:  ['kai-analyst', 'lena-brand', 'rio-ads', 'nate-growth', 'atlas-art-director', 'pixel-production'],
  Finance:    ['felix-finance'],
  Psychology: ['daniel-kahneman'],
}

export async function GET(request: NextRequest): Promise<Response> {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ventures = ['Novizio', 'Hourbour']
    const deptReports: string[] = []

    for (const [dept, agentIds] of Object.entries(DEPARTMENTS)) {
      // Get the most recent session from any agent in this department across ventures
      const sessionCandidates = await Promise.all(
        agentIds.flatMap(id =>
          ventures.map(v => getAgentSessions(id as AgentId, v, 1))
        )
      )
      const allSessions = sessionCandidates.flat()
      if (allSessions.length === 0) {
        deptReports.push(`### ${dept}\n_No sessions this week._`)
        continue
      }

      // Pick most recent session across all agents in dept
      const latest = allSessions.sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      )[0]

      const score = await callFast({
        messages: [{
          role: 'user',
          content: `You are Quinn, QA Engineer at YVON. Weekly Pulse check for ${dept} department.

Agent: ${latest.agentId}
Venture: ${latest.venture}
Task: ${latest.task}
Outcome: ${latest.outcome}

Score this output:
🟢 Green — meets standard, nothing to flag
🟡 Yellow — minor issues, flag to agent
🔴 Red — significant quality issue, escalate to Marcus

Respond in 80 words max: Score + one specific finding + one action item if Yellow/Red.`,
        }],
        maxTokens: 250,
      }).catch(() => '_Review failed_')
      deptReports.push(`### ${dept} — ${latest.agentId} (${latest.venture})\n${score}`)
    }

    const report = [
      `# Quinn Pulse — Week of ${new Date().toISOString().slice(0, 10)}`,
      ...deptReports,
      `\n_Delivered Friday 17:00 — appended to Monday Marcus CEO brief_`,
    ].join('\n\n')

    return Response.json({ ok: true, report })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
