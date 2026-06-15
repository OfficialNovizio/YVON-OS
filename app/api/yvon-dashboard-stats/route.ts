// app/api/yvon-dashboard-stats/route.ts
// Reads real agent metrics from Supabase tables (pushed by Hermes cron)
// Uses raw fetch for reliability on Vercel serverless

import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function supabaseQuery(table: string, query: string = '') {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export async function GET(): Promise<Response> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Fetch token usage (last 30 days)
    const tokenData = await supabaseQuery(
      'agent_token_usage',
      `select=*&date=gte.${new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]}&order=date.asc`
    )

    // Fetch provider health
    const providers = await supabaseQuery('provider_health', 'select=*')

    // Fetch activity
    const activity = await supabaseQuery('agent_activity', 'select=*&order=created_at.desc&limit=20')

    // Transform token data
    let tokenUsage: { date: string; tokens: number }[] = []
    let costByDept: { department: string; percentage: number; tokens: number; cost: number }[] = []
    let costTrend: { date: string; cost: number }[] = []
    let perAgentBurn: { agent: string; tokens: number; cost: number }[] = []
    let providerHealth: { provider: string; usagePercent: number; balance: number | null; configured: boolean }[] = []

    if (tokenData && Array.isArray(tokenData)) {
      const byDate = new Map<string, number>()
      const byDept = new Map<string, { tokens: number; cost: number }>()
      const byAgent = new Map<string, { tokens: number; cost: number }>()
      const byDateCost = new Map<string, number>()

      for (const row of tokenData) {
        const date = row.date
        byDate.set(date, (byDate.get(date) || 0) + Number(row.tokens))
        byDateCost.set(date, (byDateCost.get(date) || 0) + Number(row.cost))
        const dept = row.department || 'Unknown'
        const deptEntry = byDept.get(dept) || { tokens: 0, cost: 0 }
        deptEntry.tokens += Number(row.tokens)
        deptEntry.cost += Number(row.cost)
        byDept.set(dept, deptEntry)
        const agent = row.agent_name || row.agent_id
        const agentEntry = byAgent.get(agent) || { tokens: 0, cost: 0 }
        agentEntry.tokens += Number(row.tokens)
        agentEntry.cost += Number(row.cost)
        byAgent.set(agent, agentEntry)
      }

      tokenUsage = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, tokens]) => ({ date, tokens }))
      costTrend = Array.from(byDateCost.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, cost]) => ({ date, cost }))

      const totalTokens = Array.from(byDept.values()).reduce((s, d) => s + d.tokens, 0)
      costByDept = Array.from(byDept.entries()).sort(([, a], [, b]) => b.tokens - a.tokens).map(([department, { tokens, cost }]) => ({
        department, tokens, cost,
        percentage: totalTokens > 0 ? Math.round((tokens / totalTokens) * 100) : 0,
      }))

      perAgentBurn = Array.from(byAgent.entries()).sort(([, a], [, b]) => b.tokens - a.tokens).slice(0, 10).map(([agent, { tokens, cost }]) => ({ agent, tokens, cost }))
    }

    if (providers && Array.isArray(providers) && providers.length > 0) {
      providerHealth = providers.map((p: any) => ({
        provider: p.provider,
        usagePercent: Number(p.usage_percent),
        balance: p.balance ? Number(p.balance) : null,
        configured: Boolean(p.configured),
      }))
    } else {
      providerHealth = [
        { provider: 'DeepSeek', usagePercent: 80, balance: null, configured: true },
        { provider: 'OpenAI', usagePercent: 0, balance: null, configured: false },
        { provider: 'Claude', usagePercent: 0, balance: null, configured: false },
      ]
    }

    const activityFeed = (activity && Array.isArray(activity))
      ? activity.map((a: any) => ({
          time: new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          agent: a.agent_name,
          task: a.task,
          tokens: Number(a.tokens),
          duration: a.duration_sec ? `${Math.round(Number(a.duration_sec))}s` : '—',
          status: a.status,
        }))
      : []

    return NextResponse.json({ tokenUsage, costByDept, costTrend, perAgentBurn, providerHealth, activity: activityFeed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
