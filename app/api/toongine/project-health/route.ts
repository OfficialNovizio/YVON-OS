// app/api/toongine/project-health/route.ts
// Returns real project health metrics from ToonGine Supabase plugin

import { NextResponse } from 'next/server'

async function getPlugin(): Promise<any> {
  try {
    const m = await import('toongine/plugins/supabase')
    if (m.isConfigured()) return m
    return null
  } catch { return null }
}

export async function GET(): Promise<Response> {
  try {
    const p = await getPlugin()
    if (!p) return NextResponse.json({ initialized: false })

    const [hs, iss, th, cs, ah, he, rec] = await Promise.all([
      p.getHealthScore().catch(() => null),
      p.getIssues({ limit: 10 }).catch(() => [] as any[]),
      p.getToonHealth().catch(() => null),
      p.getCodebaseSnapshots(1).catch(() => [] as any[]),
      p.getApiHealth(24).catch(() => [] as any[]),
      p.getHealthEvents(10).catch(() => [] as any[]),
      p.getRecommendations(5).catch(() => [] as any[]),
    ])

    const score = hs || { overall: 0, codebase: 0, api: 0, toon: 0, issues_score: 0, burn: 0 }

    const criticalIssues = iss.filter((i: any) => i.priority === 'critical' || i.severity === 'critical')
    const highIssues = iss.filter((i: any) => i.priority === 'high' || i.severity === 'high')
    const openIssues = iss.filter((i: any) => i.status === 'open' || !i.status)

    const toon = th || { node_count: 0, edge_count: 0, compression_ratio: 0, health_pct: 0 }
    const codebase = cs[0] || { files: 0, lines: 0, languages: 0 }

    return NextResponse.json({
      initialized: true,
      score,
      issues: { total: iss.length, critical: criticalIssues.length, high: highIssues.length, open: openIssues.length, items: iss.slice(0, 5) },
      toon: { nodes: toon.node_count || 0, edges: toon.edge_count || 0, compressionRatio: toon.compression_ratio || 0, healthPct: toon.health_pct || 0 },
      codebase: { files: codebase.files || 0, lines: codebase.lines || 0, languages: codebase.languages || 0 },
      apiTimeline: ah.map((a: any) => ({
        time: new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        latency: Number(a.avg_latency_ms) || 0, errors: Number(a.error_count) || 0,
      })),
      healthEvents: he.map((e: any) => ({
        time: new Date(e.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        type: e.event_type || 'info', message: e.message || '',
      })),
      recommendations: rec.map((r: any) => ({ priority: r.priority || 'medium', text: r.recommendation || r.text || '' })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
