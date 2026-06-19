// lib/toongine.ts — ToonGine Supabase plugin
// Any project (YVON OS, etc.) imports this to read live Hermes agent data.
// Just set TOONGINE_SUPABASE_URL + TOONGINE_SUPABASE_ANON_KEY in .env.local.
//
// Usage:
//   import { getAgents, getActivity } from '@/lib/toongine'
//   const agents = await getAgents()

interface AgentSkill {
  name: string
  category: string
}

interface ToonAgent {
  id: string
  name: string
  role: string
  department: string
  level: number
  status: 'active' | 'idle' | 'offline'
  skills_count: number
  skills: AgentSkill[]
  memory_size: string
  memory_health: number
  last_active: string | null
  updated_at: string
}

interface ActivityEntry {
  id: number
  agent_name: string
  task: string
  tokens: number
  duration_sec: number
  status: string
  created_at: string
}

interface CouncilEntry {
  id: number
  topic: string
  decision: string
  votes: Record<string, any>
  summary: string
  created_at: string
}

interface SyncLog {
  synced_at: string
  agents_count: number
  activity_count: number
  status: string
}

// ── Low-level Supabase fetch ──────────────────────────────────────────

async function supabaseFetch<T>(
  table: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const url = process.env.TOONGINE_SUPABASE_URL
  const key = process.env.TOONGINE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.warn('[toongine] Missing TOONGINE_SUPABASE_URL or TOONGINE_SUPABASE_ANON_KEY')
    return []
  }

  const searchParams = new URLSearchParams(params)
  const res = await fetch(
    `${url}/rest/v1/${table}?${searchParams.toString()}`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // 5-min cache (matches sync interval)
    },
  )

  if (!res.ok) {
    console.warn(`[toongine] Supabase ${table}: ${res.status} ${res.statusText}`)
    return []
  }

  return res.json()
}

// ── Public API ────────────────────────────────────────────────────────

/** Get all agents, ordered by department then name. */
export async function getAgents(): Promise<ToonAgent[]> {
  return supabaseFetch<ToonAgent>('toongine_hermes_agents', {
    order: 'department.asc,name.asc',
  })
}

/** Get recent activity feed. */
export async function getActivity(limit = 20): Promise<ActivityEntry[]> {
  return supabaseFetch<ActivityEntry>('toongine_hermes_activity', {
    order: 'created_at.desc',
    limit: String(limit),
  })
}

/** Get advisory council decisions. */
export async function getCouncil(limit = 10): Promise<CouncilEntry[]> {
  return supabaseFetch<CouncilEntry>('toongine_hermes_council', {
    order: 'created_at.desc',
    limit: String(limit),
  })
}

/** Get last sync heartbeat. */
export async function getLastSync(): Promise<SyncLog | null> {
  const logs = await supabaseFetch<SyncLog>('toongine_hermes_sync_log', {
    order: 'synced_at.desc',
    limit: '1',
  })
  return logs[0] ?? null
}

/** Aggregate: agents grouped by department. */
export async function getDepartments(): Promise<
  { name: string; agentCount: number; skillsTotal: number }[]
> {
  const agents = await getAgents()
  const deptMap = new Map<string, { agentCount: number; skillsTotal: number }>()
  for (const a of agents) {
    const d = deptMap.get(a.department) ?? { agentCount: 0, skillsTotal: 0 }
    d.agentCount++
    d.skillsTotal += a.skills_count
    deptMap.set(a.department, d)
  }
  return Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data }))
}

/** Check if the ToonGine plugin is configured. */
export function isConfigured(): boolean {
  return !!(process.env.TOONGINE_SUPABASE_URL && process.env.TOONGINE_SUPABASE_ANON_KEY)
}
