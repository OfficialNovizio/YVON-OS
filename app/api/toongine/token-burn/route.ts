// app/api/toongine/token-burn/route.ts
// Returns real token burn metrics from ToonGine Supabase plugin

import { NextResponse } from 'next/server'

async function getPlugin(): Promise<any> {
  try {
    const m = await import('toongine/plugins/supabase')
    if (m.isConfigured()) return m
    return null
  } catch { return null }
}

function fmt(n: number, d = 2): string { return n.toFixed(d) }

export async function GET(): Promise<Response> {
  try {
    const p = await getPlugin()
    if (!p) return NextResponse.json({ initialized: false })

    const [lb, al, sn, pl] = await Promise.all([
      p.getLeaderboard(10).catch(() => []),
      p.getActivityLog(48).catch(() => []),
      p.getSnapshots(24).catch(() => []),
      p.getProviderLedger().catch(() => []),
    ])

    const tokens = al.reduce((s: number, a: any) => s + (Number(a.tokens) || 0), 0)
    const cost = al.reduce((s: number, a: any) => s + (Number(a.cost) || 0), 0)
    const sessions = new Set(al.map((a: any) => a.session_id)).size
    const avgT = sessions > 0 ? Math.round(tokens / sessions) : 0

    // Hourly buckets
    const hourly: { hour: string; tokens: number; cost: number }[] = []
    const now = Date.now()
    for (let i = 23; i >= 0; i--) {
      const start = now - (i + 1) * 3600_000
      const end = now - i * 3600_000
      const bucket = al.filter((a: any) => { const t = new Date(a.created_at).getTime(); return t >= start && t < end })
      hourly.push({
        hour: new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
        tokens: bucket.reduce((s: number, a: any) => s + (Number(a.tokens) || 0), 0),
        cost: bucket.reduce((s: number, a: any) => s + (Number(a.cost) || 0), 0),
      })
    }

    return NextResponse.json({
      initialized: true,
      kpi: { totalTokens: tokens, totalCost: Number(fmt(cost)), totalSessions: sessions, avgTokens: avgT },
      hourlyBurn: hourly,
      leaderboard: lb.map((a: any) => ({ agent: a.agent_name || 'Unknown', tokens: Number(a.total_tokens) || 0, cost: Number(a.total_cost) || 0, sessions: Number(a.session_count) || 0 })),
      providers: pl.map((p: any) => ({ name: p.provider, calls: Number(p.calls) || 0, tokens: Number(p.tokens) || 0, cost: Number(p.cost) || 0, errors: Number(p.errors) || 0, health: p.errors > 0 ? 'degraded' : 'healthy' })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
