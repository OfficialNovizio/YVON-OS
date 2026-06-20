// app/api/ventures-health/route.ts — v2
// Active-venture health monitor — queries Supabase for ONE venture's repo
// No toongine dependency — direct Supabase queries

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PROJECTS } from '@/lib/projects'

export const dynamic = 'force-dynamic'

// Map workspace key → github repo_id
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
    // Latest snapshot
    const { data: snapshots } = await supabase
      .from('toongine_snapshots')
      .select('score, created_at, metrics')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Activity aggregates
    const { data: activity } = await supabase
      .from('toongine_activity_log')
      .select('total_tokens, estimated_cost, created_at, agent, model, task')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Agent roster
    const { data: agents } = await supabase
      .from('toongine_hermes_agents')
      .select('*')
      .eq('repo_id', repoId)

    // Issues
    const { data: issues } = await supabase
      .from('toongine_issues')
      .select('*')
      .eq('repo_id', repoId)

    // Provider ledger
    const { data: providers } = await supabase
      .from('toongine_provider_ledger')
      .select('*')
      .eq('repo_id', repoId)

    const hasData = (snapshots && snapshots.length > 0) || (activity && activity.length > 0)

    if (!hasData) {
      return NextResponse.json({
        initialized: false,
        repoId,
        venture,
        message: 'No ToonGine data found for this venture. Install ToonGine in the project to start monitoring.',
      })
    }

    const snapshot = snapshots?.[0]
    const score = snapshot?.score || 0

    // Aggregate activity
    const tokensTotal = activity?.reduce((s: number, a: any) => s + (a.total_tokens || 0), 0) || 0
    const costTotal = activity?.reduce((s: number, a: any) => s + (a.estimated_cost || 0), 0) || 0
    const sessionsTotal = activity?.length || 0

    // Build hourly burn
    const hourlyMap = new Map<string, { tokens: number; cost: number }>()
    activity?.forEach((a: any) => {
      const hour = a.created_at ? new Date(a.created_at).toISOString().slice(0, 13) + ':00' : ''
      const cur = hourlyMap.get(hour) || { tokens: 0, cost: 0 }
      cur.tokens += a.total_tokens || 0
      cur.cost += a.estimated_cost || 0
      hourlyMap.set(hour, cur)
    })
    const hourlyBurn = Array.from(hourlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-24)
      .map(([hour, data]) => ({ hour, ...data }))

    // Leaderboard
    const agentMap = new Map<string, { tokens: number; cost: number; sessions: number }>()
    activity?.forEach((a: any) => {
      const name = a.agent || 'Unknown'
      const cur = agentMap.get(name) || { tokens: 0, cost: 0, sessions: 0 }
      cur.tokens += a.total_tokens || 0
      cur.cost += a.estimated_cost || 0
      cur.sessions++
      agentMap.set(name, cur)
    })
    const leaderboard = Array.from(agentMap.entries())
      .map(([agent, data]) => ({ agent, ...data }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10)

    // Agents
    const agentsActive = agents?.filter((a: any) => a.status === 'active').length || 0
    const agentsTotal = agents?.length || 0
    const departments = new Map<string, { agentCount: number }>()
    agents?.forEach((a: any) => {
      const d = departments.get(a.department) || { agentCount: 0 }
      d.agentCount++
      departments.set(a.department, d)
    })

    // Issues breakdown
    const issueBreakdown = {
      total: issues?.length || 0,
      critical: issues?.filter((i: any) => i.severity === 'critical').length || 0,
      high: issues?.filter((i: any) => i.severity === 'high').length || 0,
      open: issues?.filter((i: any) => i.status === 'open').length || 0,
    }

    // Provider breakdown
    const providerBreakdown = (providers || []).map((p: any) => ({
      name: p.provider_name || p.name,
      calls: p.calls || p.total_calls || 0,
      tokens: p.tokens || p.total_tokens || 0,
      cost: p.cost || p.total_cost || 0,
      errors: p.errors || 0,
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
        lastCheck: snapshot?.created_at || null,
      },
      hourlyBurn,
      leaderboard,
      agents: agents?.map((a: any) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        department: a.department,
        status: a.status || 'idle',
        skillsCount: a.skills_count || 0,
        memoryHealth: a.memory_health || 0,
      })) || [],
      departments: Array.from(departments.entries()).map(([name, data]) => ({ name, ...data })),
      issues: issueBreakdown,
      providers: providerBreakdown,
      activity: (activity || []).slice(0, 15).map((a: any) => ({
        time: a.created_at,
        agent: a.agent || 'Unknown',
        task: a.task || a.model || '—',
        tokens: a.total_tokens || 0,
        cost: a.estimated_cost || 0,
      })),
    })
  } catch (err: any) {
    console.error('[ventures-health]', err)
    return NextResponse.json({ initialized: false, error: err.message }, { status: 500 })
  }
}
