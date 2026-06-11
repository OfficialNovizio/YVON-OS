// GET  /api/agent-status — live agent heartbeat / activity
// Returns which agents are running, what they're working on, and health status.
// Wired from YVON 2.0's agent_memory and agent_sessions tables.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AgentStatus {
  id: string
  name: string
  role: string
  department: string
  status: 'active' | 'idle' | 'offline'
  currentTask: string | null
  lastActive: string | null
  machine: string
  avatar?: string
}

export async function GET(): Promise<Response> {
  try {
    // Get recent agent sessions (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: sessions, error } = await supabase
      .from('agent_sessions')
      .select('*')
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Graceful fallback: return static agent roster
      return Response.json({
        agents: STATIC_ROSTER.map((a) => ({ ...a, status: 'offline' as const, currentTask: null, lastActive: null })),
        machinesOnline: 1,
        agentsLive: 0,
        totalAgents: STATIC_ROSTER.length,
      })
    }

    // Build live agent map from sessions
    const agentMap = new Map<string, { lastActive: string; taskCount: number; latestTask: string | null }>()
    for (const s of sessions ?? []) {
      const existing = agentMap.get(s.agent_name) ?? { lastActive: s.created_at, taskCount: 0, latestTask: null }
      existing.taskCount++
      if (!existing.latestTask && s.title) existing.latestTask = s.title
      if (s.created_at > existing.lastActive) existing.lastActive = s.created_at
      agentMap.set(s.agent_name, existing)
    }

    // Map static roster with live activity
    const agents: AgentStatus[] = STATIC_ROSTER.map((a) => {
      const live = agentMap.get(a.name)
      if (!live) return { ...a, status: 'offline', currentTask: null, lastActive: null }
      const active = new Date(live.lastActive).getTime() > Date.now() - 30 * 60 * 1000
      return {
        ...a,
        status: active ? 'active' : 'idle',
        currentTask: live.latestTask,
        lastActive: live.lastActive,
      }
    })

    return Response.json({
      agents,
      machinesOnline: 1,
      agentsLive: agents.filter((a) => a.status === 'active').length,
      totalAgents: agents.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({
      agents: STATIC_ROSTER.map((a) => ({ ...a, status: 'offline' as const, currentTask: null, lastActive: null })),
      machinesOnline: 0,
      agentsLive: 0,
      totalAgents: STATIC_ROSTER.length,
      error: msg,
    }, { status: 500 })
  }
}

const STATIC_ROSTER: Omit<AgentStatus, 'status' | 'currentTask' | 'lastActive'>[] = [
  { id: 'marcus', name: 'Marcus', role: 'CEO', department: 'Command', machine: 'Linux VPS', avatar: '/avatars/agents/marcus-ceo.svg' },
  { id: 'diana', name: 'Diana', role: 'COO', department: 'Command', machine: 'Linux VPS', avatar: '/avatars/agents/diana-coo.svg' },
  { id: 'dev', name: 'Dev', role: 'Lead Developer', department: 'Technical', machine: 'Linux VPS', avatar: '/avatars/agents/dev-lead.svg' },
  { id: 'raj', name: 'Raj', role: 'Backend Engineer', department: 'Technical', machine: 'Linux VPS', avatar: '/avatars/agents/raj-backend.svg' },
  { id: 'mia', name: 'Mia', role: 'Frontend Engineer', department: 'Technical', machine: 'Linux VPS', avatar: '/avatars/agents/mia-frontend.svg' },
  { id: 'quinn', name: 'Quinn', role: 'QA Engineer', department: 'Technical', machine: 'Linux VPS' },
  { id: 'kai', name: 'Kai', role: 'Analyst', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/kai-analyst.svg' },
  { id: 'lena', name: 'Lena', role: 'Brand Strategist', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/lena-brand.svg' },
  { id: 'rio', name: 'Rio', role: 'Ads Manager', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/rio-ads.svg' },
  { id: 'nate', name: 'Nate', role: 'Growth Hacker', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/nate-growth.svg' },
  { id: 'atlas', name: 'Atlas', role: 'Art Director', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/atlas-art-director.svg' },
  { id: 'pixel', name: 'Pixel', role: 'Production', department: 'Marketing', machine: 'Linux VPS', avatar: '/avatars/agents/pixel-production.svg' },
  { id: 'felix', name: 'Felix', role: 'Finance Officer', department: 'Finance', machine: 'Linux VPS', avatar: '/avatars/agents/felix-finance.svg' },
]
