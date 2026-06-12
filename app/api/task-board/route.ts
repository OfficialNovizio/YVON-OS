// GET  /api/task-board?venture=x — agent tasks across all departments
// POST /api/task-board             — create/approve/complete a task
//
// Reads from agent_sessions and execution_steps tables.
// Proposed tasks are those awaiting CEO approval.
// Review tasks are completed agent work awaiting CEO sign-off.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TaskItem {
  id: string
  title: string
  description: string | null
  stage: 'proposed' | 'backlog' | 'week' | 'review' | 'done'
  agent: string
  agentAvatar?: string
  workspace: string
  priority: 'high' | 'normal' | 'low'
  createdAt: string
  completedAt: string | null
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const venture = url.searchParams.get('venture') ?? null

  try {
    let query = supabase
      .from('execution_steps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    if (venture) query = query.eq('venture_slug', venture)

    const { data: tasks, error } = await query

    if (error) {
      return Response.json({ tasks: MOCK_TASKS, total: MOCK_TASKS.length, source: 'mock' })
    }

    const mapped: TaskItem[] = (tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title ?? t.description?.slice(0, 80) ?? 'Untitled',
      description: t.description ?? null,
      stage: t.status === 'completed' ? 'done' : t.status === 'needs_review' ? 'review' : t.status === 'needs_approval' ? 'proposed' : 'backlog',
      agent: t.agent_name ?? 'Unknown',
      workspace: t.venture_slug ?? 'vibe',
      priority: t.priority === 'critical' ? 'high' : t.priority === 'high' ? 'high' : 'normal',
      createdAt: t.created_at,
      completedAt: t.completed_at ?? null,
    }))

    return Response.json({ tasks: mapped.length > 0 ? mapped : MOCK_TASKS, total: mapped.length || MOCK_TASKS.length, source: mapped.length > 0 ? 'live' : 'mock' })
  } catch (err) {
    return Response.json({ tasks: MOCK_TASKS, total: MOCK_TASKS.length, source: 'mock' })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { id, action } = body
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 })

    const update: Record<string, unknown> = {}
    if (action === 'approve') update.status = 'in_progress'
    else if (action === 'complete') { update.status = 'completed'; update.completed_at = new Date().toISOString() }
    else if (action === 'return') update.status = 'needs_work'
    else return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })

    await supabase.from('execution_steps').update(update).eq('id', id)
    return Response.json({ success: true, id, action })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

const MOCK_TASKS: TaskItem[] = [
  { id: 'mt1', title: 'Research: is agent-as-a-service a real category?', description: 'Analyze market signals for AaaS as a product category', stage: 'proposed', agent: 'Kai', workspace: 'vibe', priority: 'high', createdAt: new Date().toISOString(), completedAt: null },
  { id: 'mt2', title: 'Fix cart badge count on mobile tap', description: 'Cart badge shows wrong count on first tap', stage: 'week', agent: 'Dev', workspace: 'novizio', priority: 'high', createdAt: new Date().toISOString(), completedAt: null },
  { id: 'mt3', title: 'Draft newsletter #13 outline', description: 'Monthly newsletter about agent automation', stage: 'backlog', agent: 'Lena', workspace: 'vibe', priority: 'normal', createdAt: new Date().toISOString(), completedAt: null },
  { id: 'mt4', title: 'Newsletter #12 — first draft', description: 'Complete first draft ready for review', stage: 'review', agent: 'Lena', workspace: 'vibe', priority: 'normal', createdAt: new Date().toISOString(), completedAt: null },
  { id: 'mt5', title: 'LinkedIn carousel — tighten the hook', description: 'Improve opening hook for better engagement', stage: 'done', agent: 'William', workspace: 'vibe', priority: 'normal', createdAt: new Date(Date.now() - 86400000).toISOString(), completedAt: new Date().toISOString() },
  { id: 'mt6', title: 'Rotate leaked Google API key', description: 'Security — credential appeared in logs', stage: 'proposed', agent: 'Knox', workspace: 'vibe', priority: 'high', createdAt: new Date().toISOString(), completedAt: null },
]
