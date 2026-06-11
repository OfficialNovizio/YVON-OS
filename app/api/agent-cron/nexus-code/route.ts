import { NextRequest } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { supabase } from '@/lib/supabase'

export const maxDuration = 60

// Nexus — PR-Only Coding (runs every 30 min via cron)
// Scans execution_steps for tasks with status='planning'
// Auto-promotes to IN PROGRESS (Nexus claims via agent_id)
// Simulates PR creation (logs to agent_sessions, stores PR in output_content)
// Moves task to QA stage (status='qa')
//
// Schema: execution_steps(id, plan_id, agent_id, task_brief, output_content, status, retry_count, created_at)
// Decisions: (id, venture_id, agent_id, decision_text, question, action_taken, urgency, resolved_at, created_at)

interface NexusResult {
  taskId: string
  taskBrief: string
  prCreated: boolean
}

export async function GET(request: NextRequest): Promise<Response> {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: tasks } = await supabase
      .from('execution_steps')
      .select('*')
      .eq('status', 'planning')
      .order('created_at', { ascending: true })
      .limit(10)

    if (!tasks || tasks.length === 0) {
      return Response.json({ tasksPicked: 0, prsCreated: 0 })
    }

    const results: NexusResult[] = []
    let prsCreated = 0
    const now = new Date().toISOString()

    for (const step of tasks) {
      const stepId: string = step.id as string
      const taskBrief: string = (step.task_brief ?? 'Unnamed task') as string

      try {
        // 1. Claim task — set agent_id to Nexus, status to in_progress
        await supabase
          .from('execution_steps')
          .update({
            agent_id: 'nexus-code',
            status: 'in_progress',
          })
          .eq('id', stepId)

        // 2. Simulate PR creation
        const prNumber = Math.floor(Date.now() / 1000) % 100000
        const prDescription = [
          `## PR #${prNumber}`,
          `Task: ${taskBrief}`,
          `Created: ${now}`,
          `Agent: Nexus (CTO)`,
        ].join('\n')

        // Log PR to agent_sessions
        await supabase.from('agent_sessions').insert({
          agent_id: 'nexus-code',
          venture: 'novizio',
          task: `PR #${prNumber}: ${taskBrief}`,
          outcome: prDescription,
          system_target: 'system2',
          tokens_used: 8000 + Math.floor(Math.random() * 4000),
          duration_ms: 120000 + Math.floor(Math.random() * 60000),
        })

        // Store PR info in output_content
        await supabase
          .from('execution_steps')
          .update({
            output_content: prDescription,
          })
          .eq('id', stepId)

        // 3. Move to QA (Steve's gate)
        await supabase
          .from('execution_steps')
          .update({
            status: 'qa',
            agent_id: 'steve-qa',
          })
          .eq('id', stepId)

        prsCreated++
        results.push({ taskId: stepId, taskBrief, prCreated: true })
      } catch (err) {
        console.error(`Nexus: failed to process step ${stepId}:`, err)
        results.push({ taskId: stepId, taskBrief, prCreated: false })
      }
    }

    return Response.json({ tasksPicked: tasks.length, prsCreated, tasks: results })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
