// app/api/ventures-health/route.ts — v3
// Schema-compliant queries matching actual Supabase tables

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'

export const dynamic = 'force-dynamic'

function getRepoId(venture: string): string | null {
  const p = PROJECTS.find(p => p.id === venture)
  return p?.githubRepo || null
}

export async function GET(req: NextRequest) {
  const venture = req.nextUrl.searchParams.get('venture') || 'novizio'
  const repoId = getRepoId(venture)

  if (!repoId) {
    return NextResponse.json({ initialized: false, error: `No repo mapping for venture: ${venture}` })
  }

  try {
    // Activity log (tokens_in + tokens_out = total per row)
    const { data: activity } = await supabase
      .from('toongine_activity_log')
      .select('tokens_in, tokens_out, cost_usd, agent_name, provider, model, task, status, created_at')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(100)

    // Snapshots (hourly)
    const { data: snapshots } = await supabase
      .from('toongine_snapshots')
      .select('tokens_total, cost_total, run_count, active_agents, efficiency_pct, period_start, created_at')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(24)

    // Agent roster
    const { data: agents } = await supabase
      .from('toongine_hermes_agents')
      .select('id, name, role, department, status, skills_count, memory_health, last_active')

    // Issues
    const { data: issues } = await supabase
      .from('toongine_issues')
      .select('priority, severity, status, title, category')
      .eq('repo_id', repoId)

    // Provider ledger
    const { data: providers } = await supabase
      .from('toongine_provider_ledger')
      .select('provider, total_spent, total_tokens, state')
      .eq('repo_id', repoId)

    // Project info
    const { data: project } = await supabase
      .from('toongine_projects')
      .select('repo_id, repo_name, total_runs, total_tokens, total_cost, last_active_at')
      .eq('repo_id', repoId)
      .single()

    const hasData = (activity && activity.length > 0) || (snapshots && snapshots.length > 0) || project

    if (!hasData) {
      return NextResponse.json({
        initialized: false,
        repoId,
        venture,
        message: 'No ToonGine data found. Install ToonGine in the project.',
      })
    }

    // ── Compute KPIs ─────────────────────────────────────────────────────────
    const tokensTotal = activity?.reduce((s, a) => s + (a.tokens_in || 0) + (a.tokens_out || 0), 0) || 0
    const costTotal = activity?.reduce((s, a) => s + (a.cost_usd || 0), 0) || 0
    const sessionsTotal = activity?.length || 0

    // Health score from latest snapshot
    const latestSnapshot = snapshots?.[0]
    const efficiency = latestSnapshot?.efficiency_pct || 0
    const score = Math.min(100, Math.round(efficiency > 0 ? efficiency : 85))

    // Hourly burn
    const hourlyMap = new Map<string, { tokens: number; cost: number }>()
    activity?.forEach(a => {
      const hour = a.created_at ? new Date(a.created_at).toISOString().slice(0, 13) + ':00' : ''
      const cur = hourlyMap.get(hour) || { tokens: 0, cost: 0 }
      cur.tokens += (a.tokens_in || 0) + (a.tokens_out || 0)
      cur.cost += a.cost_usd || 0
      hourlyMap.set(hour, cur)
    })
    const hourlyBurn = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([hour, data]) => ({ hour, ...data }))

    // Leaderboard (by agent_name)
    const agentMap = new Map<string, { tokens: number; cost: number; sessions: number }>()
    activity?.forEach(a => {
      const name = a.agent_name || 'Unknown'
      const cur = agentMap.get(name) || { tokens: 0, cost: 0, sessions: 0 }
      cur.tokens += (a.tokens_in || 0) + (a.tokens_out || 0)
      cur.cost += a.cost_usd || 0
      cur.sessions++
      agentMap.set(name, cur)
    })
    const leaderboard = Array.from(agentMap.entries())
      .map(([agent, data]) => ({ agent, ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10)

    // Agent roster
    const agentsActive = agents?.filter(a => a.status === 'active').length || 0
    const agentsTotal = agents?.length || 0
    const deptMap = new Map<string, { agentCount: number }>()
    agents?.forEach(a => {
      const d = deptMap.get(a.department) || { agentCount: 0 }
      d.agentCount++
      deptMap.set(a.department, d)
    })

    // Issues breakdown
    const issueBreakdown = {
      total: issues?.length || 0,
      critical: issues?.filter(i => i.priority === 0 || i.severity === 3).length || 0,
      high: issues?.filter(i => i.priority === 1 || i.severity === 2).length || 0,
      open: issues?.filter(i => i.status === 'open').length || 0,
    }

    // Provider breakdown
    const providerBreakdown = (providers || []).map(p => ({
      name: p.provider,
      calls: 0,
      tokens: p.total_tokens || 0,
      cost: p.total_spent || 0,
      errors: 0,
    }))

    return NextResponse.json({
      initialized: true,
      repoId,
      venture,
      kpi: {
        score,
        status: score >= 90 ? 'healthy' : score >= 70 ? 'degraded' : 'critical',
        tokensTotal,
        costTotal,
        sessionsTotal,
        avgTokensPerCall: sessionsTotal > 0 ? Math.round(tokensTotal / sessionsTotal) : 0,
        avgCostPerCall: sessionsTotal > 0 ? costTotal / sessionsTotal : 0,
        agentsActive,
        agentsTotal,
        lastCheck: project?.last_active_at || latestSnapshot?.created_at || null,
      },
      hourlyBurn,
      leaderboard,
      agents: agents?.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        department: a.department,
        status: a.status || 'idle',
        skillsCount: a.skills_count || 0,
        memoryHealth: a.memory_health || 0,
      })) || [],
      departments: Array.from(deptMap.entries()).map(([name, data]) => ({ name, ...data })),
      issues: issueBreakdown,
      providers: providerBreakdown,
      activity: (activity || []).slice(0, 15).map(a => ({
        time: a.created_at,
        agent: a.agent_name || 'Unknown',
        task: a.task || a.model || '—',
        tokens: (a.tokens_in || 0) + (a.tokens_out || 0),
        cost: a.cost_usd || 0,
      })),
    })
  } catch (err: any) {
    console.error('[ventures-health]', err)
    return NextResponse.json({ initialized: false, error: err.message }, { status: 500 })
  }
}
