import { NextRequest } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

// Knox — Security Stops (runs every 30 min via cron)
// Scans recent agent_sessions for credential patterns (API keys, tokens, passwords)
// If found: creates Decision Queue item with severity 'critical'
// Logs security event
//
// Returns: { scanned, leaksFound, alerts }

// Credential patterns to detect in agent session content
const CREDENTIAL_PATTERNS: Array<{ name: string; regex: RegExp; severity: string }> = [
  {
    name: 'API Key',
    regex: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['"]?[a-zA-Z0-9_\-.]{20,}['"]?/gi,
    severity: 'critical',
  },
  {
    name: 'Bearer Token',
    regex: /bearer\s+[a-zA-Z0-9_\-.]{20,}/gi,
    severity: 'critical',
  },
  {
    name: 'AWS Key',
    regex: /(?:AKIA|ASIA)[A-Z0-9]{16}/g,
    severity: 'critical',
  },
  {
    name: 'Private Key',
    regex: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH)\s+PRIVATE\s+KEY-----/g,
    severity: 'critical',
  },
  {
    name: 'Password Assignment',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]/gi,
    severity: 'high',
  },
  {
    name: 'GitHub Token',
    regex: /(?:gh[pousr]_[A-Za-z0-9_]{36,}|github[_\-]?token\s*[:=]\s*['"]?[a-zA-Z0-9_]{20,}['"]?)/gi,
    severity: 'critical',
  },
  {
    name: 'Supabase Key',
    regex: /(?:supabase|sb)[_-]?(?:service_role|anon)[_-]?key\s*[:=]\s*['"]?[a-zA-Z0-9_\-.]{20,}['"]?/gi,
    severity: 'critical',
  },
  {
    name: 'JWT Token',
    regex: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
    severity: 'high',
  },
  {
    name: 'Connection String',
    regex: /(?:mongodb|postgres(?:ql)?|mysql|redis):\/\/[^:\s]+:[^@\s]+@/gi,
    severity: 'critical',
  },
]

interface SecurityAlert {
  sessionId: string
  agentId: string
  venture: string
  patternMatched: string
  severity: string
  contextSnippet: string
}

export async function GET(request: NextRequest): Promise<Response> {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Scan recent agent_sessions (last 24 hours or last 200 sessions)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: sessions } = await supabase
      .from('agent_sessions')
      .select('id, agent_id, venture, task, outcome, created_at')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!sessions || sessions.length === 0) {
      return Response.json({ scanned: 0, leaksFound: 0, alerts: [] })
    }

    const alerts: SecurityAlert[] = []

    for (const session of sessions) {
      const sessionId: string = session.id as string
      const agentId: string = (session.agent_id ?? 'unknown') as string
      const venture: string = (session.venture ?? 'unknown') as string
      const task: string = (session.task ?? '') as string
      const outcome: string = (session.outcome ?? '') as string

      // Combine task + outcome for scanning
      const content = `${task}\n${outcome}`

      for (const pattern of CREDENTIAL_PATTERNS) {
        // Reset regex lastIndex
        pattern.regex.lastIndex = 0
        const match = pattern.regex.exec(content)
        if (match) {
          const matchedText = match[0]
          // Get surrounding context (40 chars before/after)
          const matchIndex = match.index
          const start = Math.max(0, matchIndex - 40)
          const end = Math.min(content.length, matchIndex + matchedText.length + 40)
          const contextSnippet = content.slice(start, end).replace(/\n/g, ' ')

          // Check if we already have an alert for this session + pattern
          const alreadyAlerted = alerts.some(
            (a) => a.sessionId === sessionId && a.patternMatched === pattern.name
          )
          if (alreadyAlerted) continue

          alerts.push({
            sessionId,
            agentId,
            venture,
            patternMatched: pattern.name,
            severity: pattern.severity,
            contextSnippet,
          })
        }
      }
    }

    // Create Decision Queue items for each security alert
    for (const alert of alerts) {
      try {
        await supabase.from('decisions').insert({
          venture_id: alert.venture,
          agent_id: 'knox-security',
          decision_text: `[SECURITY] ${alert.patternMatched} leak detected in agent session`,
          question: [
            `**Severity:** ${alert.severity.toUpperCase()}`,
            `**Agent:** ${alert.agentId}`,
            `**Session:** ${alert.sessionId}`,
            `**Pattern:** ${alert.patternMatched}`,
            '',
            `**Context:** \`...${alert.contextSnippet}...\``,
            '',
            '**Recommended action:** Rotate credentials immediately. Audit the session for full exposure scope.',
          ].join('\n'),
          urgency: alert.severity === 'critical' ? 'critical' : 'today',
        })

        // Log security event to agent_sessions for audit trail
        await supabase.from('agent_sessions').insert({
          agent_id: 'knox-security',
          venture: alert.venture,
          task: `Security alert: ${alert.patternMatched} detected in ${alert.agentId} session ${alert.sessionId}`,
          outcome: `Severity: ${alert.severity}. Decision created for CEO review.`,
          system_target: 'system2',
        })
      } catch (insertErr) {
        // Non-fatal — continue with next alert
        console.error(`Knox: failed to create decision for alert:`, insertErr)
      }
    }

    return Response.json({
      scanned: sessions.length,
      leaksFound: alerts.length,
      alerts,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
