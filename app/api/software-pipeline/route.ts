// GET  /api/software-pipeline?workspace=vibe      — fetch pipeline items
// POST /api/software-pipeline                       — act on a task (review/approve/return)
//
// Sources:
//   - Supabase execution_steps (code tasks: Triage→Planning→InProgress→QA→Review→Done)
//   - Supabase agent_sessions (for recent Nexus/Quinn activity)
//   - YVON build-gate.ts logic ported: Nexus PRs only, Steve QA gate, CEO final review

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PipelineStage {
  title: string
  tone: 'yellow' | 'green' | 'blue' | 'muted'
  tasks: PipelineTask[]
}

export interface PipelineTask {
  id: string
  title: string
  agent: string
  agentInititals: string
  description?: string
  status: string
  priority?: string
  tags?: string[]
  needsReview?: boolean
  prUrl?: string
}

export interface PipelineResponse {
  tasks: PipelineStage[]
  recentActivity: string[]
  qaFailures: number
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const workspace = url.searchParams.get('workspace') ?? 'all'

  try {
    // ── 1. Fetch code tasks from execution_steps ────────────────────────────
    const { data: steps } = await supabase
      .from('execution_steps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80)

    // Map status to pipeline stage
    const stageMap: Record<string, string> = {
      'triage': 'Triage',
      'planning': 'Planning',
      'backlog': 'Backlog',
      'in_progress': 'In progress',
      'in-progress': 'In progress',
      'qa': 'Steve QA',
      'needs_review': 'Needs review',
      'needs-review': 'Needs review',
      'done': 'Done',
      'completed': 'Done',
      'merged': 'Done',
    }

    const stages: PipelineStage[] = [
      { title: 'Triage', tone: 'muted', tasks: [] },
      { title: 'Planning', tone: 'muted', tasks: [] },
      { title: 'Backlog', tone: 'muted', tasks: [] },
      { title: 'In progress', tone: 'blue', tasks: [] },
      { title: 'Steve QA', tone: 'blue', tasks: [] },
      { title: 'Needs review', tone: 'yellow', tasks: [] },
      { title: 'Done', tone: 'green', tasks: [] },
    ]

    let qaFailures = 0

    if (steps) {
      for (const step of steps) {
        const stageName = stageMap[step.status] ?? 'Backlog'
        const stage = stages.find((s) => s.title === stageName)
        if (!stage) continue

        // Filter by workspace if requested
        if (workspace !== 'all' && step.venture_slug && step.venture_slug !== workspace) continue

        const agentName = step.agent_name ?? 'Nexus'
        stage.tasks.push({
          id: step.id,
          title: step.title ?? step.description?.slice(0, 80) ?? 'Unnamed task',
          agent: agentName,
          agentInititals: agentName.slice(0, 2).toUpperCase(),
          description: step.description,
          status: step.status,
          priority: step.priority,
          tags: step.tags ?? [],
          needsReview: step.status === 'needs_review' || step.status === 'needs-review',
          prUrl: step.pr_url ?? undefined,
        })

        // Count QA failures
        if (step.status === 'qa_failed') qaFailures++
      }
    }

    // ── 2. Get recent agent activity ────────────────────────────────────────
    let recentActivity: string[] = []
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: sessions } = await supabase
        .from('agent_sessions')
        .select('agent_name, summary')
        .gte('ended_at', yesterday)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(5)

      if (sessions) {
        recentActivity = sessions.map(
          (s) => `${s.agent_name}: ${s.summary?.slice(0, 90) ?? 'completed task'}`
        )
      }
    } catch {
      // Optional — pipeline still works without activity
    }

    // ── 3. If no live data, seed with YVON task flows ──────────────────────
    const hasData = stages.some((s) => s.tasks.length > 0)

    if (!hasData) {
      // Dev task — Nexxon AI agent test
      stages[1].tasks.push({
        id: 'seed-plan-1',
        title: 'Decision-queue keyboard shortcuts for power users',
        agent: 'Nexus',
        agentInititals: 'NX',
        status: 'planning',
      })
      stages[3].tasks.push({
        id: 'seed-ip-1',
        title: 'Apple sign-in flow for ventures',
        agent: 'Nexus',
        agentInititals: 'NX',
        status: 'in_progress',
      })
      stages[3].tasks.push({
        id: 'seed-ip-2',
        title: 'Shopify webhook retry with exponential backoff',
        agent: 'Nexus',
        agentInititals: 'NX',
        status: 'in_progress',
      })
      stages[4].tasks.push({
        id: 'seed-qa-1',
        title: 'Brain search relevance tuning — vector index optimization',
        agent: 'Steve',
        agentInititals: 'ST',
        status: 'qa',
      })
      stages[5].tasks.push({
        id: 'seed-rv-1',
        title: 'Voice-memo intake → structured idea card pipeline',
        agent: 'Nexus',
        agentInititals: 'NX',
        description: 'Record a voice memo, get a clean structured idea card with title, summary, and suggested next step. Steve QA passed — awaiting your final review.',
        needsReview: true,
        status: 'needs_review',
      })
      stages[6].tasks.push({
        id: 'seed-done-1',
        title: 'Push notification opt-in with per-venture settings',
        agent: 'Nexus',
        agentInititals: 'NX',
        status: 'done',
      })
      stages[6].tasks.push({
        id: 'seed-done-2',
        title: 'Discount-code field at checkout + Supabase validation',
        agent: 'Nexus',
        agentInititals: 'NX',
        status: 'done',
      })
      recentActivity = [
        'Nexus: pushed PR #23 — voice-memo pipeline (Steve QA passed)',
        'Steve: completed QA sweep — 2 tasks approved, 0 returned',
        'Nexus: opened PR #24 — Apple sign-in flow for ventures',
      ]
    }

    return Response.json({
      tasks: stages.filter((s) => s.tasks.length > 0),
      recentActivity,
      qaFailures,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ tasks: [], recentActivity: [], qaFailures: 0, error: msg }, { status: 500 })
  }
}

// ── POST — Review / approve / return a task ──────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { taskId, action } = body

    if (!taskId || !action) {
      return Response.json({ error: 'taskId and action required' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}

    switch (action) {
      case 'approve':
        update.status = 'done'
        update.reviewed_at = new Date().toISOString()
        break
      case 'return':
        update.status = 'planning'
        update.returned_at = new Date().toISOString()
        break
      case 'qa_pass':
        update.status = 'needs_review'
        update.qa_passed_at = new Date().toISOString()
        break
      case 'qa_fail':
        update.status = 'planning'
        update.qa_failed_at = new Date().toISOString()
        break
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    const { error } = await supabase
      .from('execution_steps')
      .update(update)
      .eq('id', taskId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, taskId, action, updated: update })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
