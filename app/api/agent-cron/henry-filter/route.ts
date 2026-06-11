import { NextRequest } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

// Henry — Decision Queue Filtering (runs every 30 min via cron)
// Scans all unresolved decisions across ventures
// Auto-handles low-risk items (urgency='this-week', non-critical decision patterns)
// Escalates items that genuinely need human review
//
// Returns: { autoHandled, escalated, items }

interface HenryResult {
  id: string
  ventureId: string
  title: string
  urgency: string
  action: 'auto_handled' | 'escalated'
  reason: string
}

export async function GET(request: NextRequest): Promise<Response> {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Scan all unresolved decisions
    const { data: decisions } = await supabase
      .from('decisions')
      .select('*')
      .is('action_taken', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!decisions || decisions.length === 0) {
      return Response.json({ autoHandled: 0, escalated: 0, items: [] })
    }

    const results: HenryResult[] = []
    let autoHandled = 0
    let escalated = 0

    for (const d of decisions) {
      const decisionText: string = (d.decision_text ?? '') as string
      const urgency: string = (d.urgency ?? 'this-week') as string
      const ventureId: string = (d.venture_id ?? 'unknown') as string
      const id: string = d.id as string

      // Low-risk heuristics:
      // 1. Urgency is 'this-week' (not 'today' or 'critical')
      // 2. Decision text contains FYI/routine/notification keywords
      const isLowUrgency = urgency === 'this-week'
      const fyiPattern = /\b(fyi|routine|notification|status update|info only)\b/i
      const isFyiRoutine = fyiPattern.test(decisionText)

      // Auto-handle if low urgency AND low-risk content pattern
      // OR if urgency is 'this-week' and the decision is short (likely informational)
      const shouldAutoHandle =
        (isLowUrgency && isFyiRoutine) ||
        (isLowUrgency && decisionText.length < 100 && !decisionText.includes('blocked'))

      if (shouldAutoHandle) {
        // Auto-resolve the decision
        await supabase
          .from('decisions')
          .update({
            action_taken: 'approved',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', id)

        // Log to agent_sessions for audit trail
        await supabase.from('agent_sessions').insert({
          agent_id: 'henry-filter',
          venture: ventureId,
          task: `Auto-handled decision: ${decisionText.slice(0, 120)}`,
          outcome: 'auto_approved',
          system_target: 'system2',
        })

        autoHandled++
        results.push({
          id,
          ventureId,
          title: decisionText.slice(0, 80),
          urgency,
          action: 'auto_handled',
          reason: 'Low urgency + FYI/routine content pattern',
        })
      } else {
        // Escalate — keep as unresolved, just track it
        escalated++
        results.push({
          id,
          ventureId,
          title: decisionText.slice(0, 80),
          urgency,
          action: 'escalated',
          reason: isLowUrgency
            ? 'Non-trivial content needs human review'
            : `Urgency=${urgency} — requires human attention`,
        })
      }
    }

    return Response.json({ autoHandled, escalated, items: results })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
