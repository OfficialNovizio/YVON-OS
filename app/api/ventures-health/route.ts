// app/api/ventures-health/route.ts — v6
// OS agents (no venture param) → aggregate all projects from VPS
// Venture agents (?venture=novizio) → per-project from VPS
// VPS: http://2.25.189.22:4201 — real metrics from Hermes state.db

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const VPS_URL = process.env.VPS_METRICS_URL || 'http://2.25.189.22:4201'

interface VpsMetrics {
  tokens_total: number; cost_total: number; sessions: number
  agents: Record<string, { tokens: number; cost: number; sessions: number }>
  providers: Record<string, { tokens: number; cost: number }>
  hourly: { hour: number; tokens: number; cost: number; sessions: number }[]
  last_updated?: string
  projects?: { name: string; tokens: number; cost: number; sessions: number }[]
}

interface VpsAgent {
  name: string; department: string
  memory_size: number; memory_updated: string | null
}

async function vpsGet(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${VPS_URL}${path}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function computeScore(m: VpsMetrics, agentCount: number): { score: number; status: string } {
  const tokensOk = m.tokens_total > 0
  const agentsOk = agentCount >= 10
  const hasHourly = m.hourly?.length > 0
  const checks = [tokensOk, agentsOk, hasHourly].filter(Boolean).length
  if (checks === 3) return { score: 95, status: 'healthy' }
  if (checks === 2) return { score: 75, status: 'warming' }
  if (checks === 1) return { score: 45, status: 'initializing' }
  return { score: 10, status: 'offline' }
}

function transformMetrics(m: VpsMetrics, agentCount: number) {
  const { score, status } = computeScore(m, agentCount)
  return {
    kpi: {
      score,
      status,
      tokensTotal: m.tokens_total,
      costTotal: m.cost_total,
      sessionsTotal: m.sessions,
      avgTokensPerCall: m.sessions > 0 ? Math.round(m.tokens_total / m.sessions) : 0,
      avgCostPerCall: m.sessions > 0 ? m.cost_total / m.sessions : 0,
      agentsActive: m.agents ? Object.keys(m.agents).length : 0,
      agentsTotal: agentCount,
      lastCheck: m.last_updated || null,
    },
    hourlyBurn: (m.hourly || []).map(h => ({
      hour: `${String(h.hour).padStart(2, '0')}:00`,
      tokens: h.tokens,
      cost: h.cost,
    })),
    leaderboard: Object.entries(m.agents || {})
      .map(([agent, d]) => ({ agent, tokens: d.tokens, cost: d.cost, sessions: d.sessions }))
      .sort((a, b) => b.tokens - a.tokens),
    providers: Object.entries(m.providers || {}).map(([name, d]) => ({
      name, calls: 0, tokens: d.tokens, cost: d.cost, errors: 0,
    })),
  }
}

function transformAgents(agents: VpsAgent[]) {
  return agents.map((a, i) => ({
    id: `${a.department}-${a.name}`,
    name: a.name,
    role: a.department,
    department: a.department,
    status: 'active',
    skillsCount: 0,
    memoryHealth: a.memory_size > 0 ? Math.min(100, Math.max(10, Math.round(a.memory_size / 10))) : 50,
  }))
}

export async function GET(req: NextRequest) {
  const ventureParam = req.nextUrl.searchParams.get('venture') || ''

  // ── OS Agents (no venture param) → aggregate all projects ─────────────
  if (!ventureParam) {
    const all = await vpsGet('/metrics/all') as VpsMetrics | null
    const agentsData = await vpsGet('/agents?project=yvon-os') as { agents: VpsAgent[] } | null
    const agentCount = agentsData?.agents?.length || 0

    if (all) {
      const { kpi, hourlyBurn, leaderboard, providers } = transformMetrics(all, agentCount)
      return NextResponse.json({
        initialized: true,
        venture: 'YVON OS',
        source: 'vps',
        repoId: 'all',
        kpi,
        agents: agentsData ? transformAgents(agentsData.agents) : [],
        agentsTotal: agentCount,
        departments: {},
        hourlyBurn,
        leaderboard,
        providers,
        issues: { total: 0, critical: 0, high: 0, open: 0 },
        activity: [],
        projects: all.projects || [],
      })
    }

    return NextResponse.json({
      initialized: false,
      venture: 'YVON OS',
      source: 'vps',
      kpi: { score: 10, status: 'offline', tokensTotal: 0, costTotal: 0, sessionsTotal: 0, avgTokensPerCall: 0, avgCostPerCall: 0, agentsActive: 0, agentsTotal: 0, lastCheck: null },
      agents: [], hourlyBurn: [], leaderboard: [], providers: [], issues: null, activity: [],
    })
  }

  // ── Venture Agents → Agents tab ───────────────────────────────────────
  const m = await vpsGet(`/metrics?project=${ventureParam}`) as VpsMetrics | null
  const a = await vpsGet(`/agents?project=${ventureParam}`) as { agents: VpsAgent[] } | null

  const agents = a?.agents || []
  const agentCount = agents.length

  if (m) {
    const { kpi, hourlyBurn, leaderboard, providers } = transformMetrics(m, agentCount)
    return NextResponse.json({
      initialized: true,
      venture: ventureParam,
      source: 'vps',
      repoId: ventureParam,
      kpi,
      agents: transformAgents(agents),
      agentsTotal: agentCount,
      departments: {},
      hourlyBurn,
      leaderboard,
      providers,
      issues: { total: 0, critical: 0, high: 0, open: 0 },
      activity: [],
    })
  }

  return NextResponse.json({
    initialized: false,
    venture: ventureParam,
    kpi: null,
  })
}
