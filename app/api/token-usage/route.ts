// ── GET /api/token-usage ──────────────────────────────────────────────────────
// Returns aggregated token usage from Supabase token_usage table.
// Falls back to empty mock data if Supabase is not configured.

interface RawUsageRow {
  agent_id: string | null
  route: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_creation_tokens: number
  cost_usd: number
  venture_id: string | null
  created_at: string
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '30')
  const ventureId = searchParams.get('ventureId') ?? null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // ── Fetch from Supabase if configured ────────────────────────────────────────
  let rows: RawUsageRow[] = []

  if (supabaseUrl && supabaseKey) {
    try {
      const since = new Date(Date.now() - days * 86_400_000).toISOString()
      let url = `${supabaseUrl}/rest/v1/token_usage?created_at=gte.${since}&order=created_at.desc&limit=2000`
      if (ventureId) url += `&venture_id=eq.${ventureId}`

      const res = await fetch(url, {
        headers: {
          apikey:        supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      })
      if (res.ok) {
        rows = await res.json() as RawUsageRow[]
      }
    } catch { /* fall through to empty rows */ }
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────────
  const totals = {
    inputTokens:          0,
    outputTokens:         0,
    cacheReadTokens:      0,
    cacheCreationTokens:  0,
    totalTokens:          0,
    costUsd:              0,
    requests:             rows.length,
  }

  const byAgent: Record<string, {
    agentId: string
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    costUsd: number
    requests: number
  }> = {}

  const byRoute: Record<string, {
    route: string
    inputTokens: number
    outputTokens: number
    costUsd: number
    requests: number
  }> = {}

  const byModel: Record<string, {
    model: string
    inputTokens: number
    outputTokens: number
    costUsd: number
    requests: number
  }> = {}

  // Daily buckets — last N days
  const dailyMap: Record<string, { date: string; inputTokens: number; outputTokens: number; costUsd: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    dailyMap[d] = { date: d, inputTokens: 0, outputTokens: 0, costUsd: 0 }
  }

  for (const row of rows) {
    totals.inputTokens         += row.input_tokens
    totals.outputTokens        += row.output_tokens
    totals.cacheReadTokens     += row.cache_read_tokens
    totals.cacheCreationTokens += row.cache_creation_tokens
    totals.totalTokens         += row.input_tokens + row.output_tokens
    totals.costUsd             += row.cost_usd

    // By agent
    const aid = row.agent_id ?? 'unknown'
    if (!byAgent[aid]) byAgent[aid] = { agentId: aid, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0, requests: 0 }
    byAgent[aid].inputTokens    += row.input_tokens
    byAgent[aid].outputTokens   += row.output_tokens
    byAgent[aid].cacheReadTokens += row.cache_read_tokens
    byAgent[aid].costUsd        += row.cost_usd
    byAgent[aid].requests       += 1

    // By route
    const rt = row.route ?? 'unknown'
    if (!byRoute[rt]) byRoute[rt] = { route: rt, inputTokens: 0, outputTokens: 0, costUsd: 0, requests: 0 }
    byRoute[rt].inputTokens  += row.input_tokens
    byRoute[rt].outputTokens += row.output_tokens
    byRoute[rt].costUsd      += row.cost_usd
    byRoute[rt].requests     += 1

    // By model
    const mdl = row.model ?? 'unknown'
    if (!byModel[mdl]) byModel[mdl] = { model: mdl, inputTokens: 0, outputTokens: 0, costUsd: 0, requests: 0 }
    byModel[mdl].inputTokens  += row.input_tokens
    byModel[mdl].outputTokens += row.output_tokens
    byModel[mdl].costUsd      += row.cost_usd
    byModel[mdl].requests     += 1

    // Daily
    const day = row.created_at?.slice(0, 10)
    if (day && dailyMap[day]) {
      dailyMap[day].inputTokens  += row.input_tokens
      dailyMap[day].outputTokens += row.output_tokens
      dailyMap[day].costUsd      += row.cost_usd
    }
  }

  // Cache hit rate
  const cacheHitRate = totals.inputTokens > 0
    ? Math.round((totals.cacheReadTokens / (totals.inputTokens + totals.cacheReadTokens)) * 100)
    : 0

  return Response.json({
    days,
    totals: { ...totals, costUsd: Math.round(totals.costUsd * 10000) / 10000 },
    cacheHitRate,
    byAgent:  Object.values(byAgent).sort((a, b) => b.costUsd - a.costUsd),
    byRoute:  Object.values(byRoute).sort((a, b) => b.costUsd - a.costUsd),
    byModel:  Object.values(byModel).sort((a, b) => b.costUsd - a.costUsd),
    daily:    Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    hasData:  rows.length > 0,
  })
}
