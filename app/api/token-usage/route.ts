// ── GET /api/token-usage ──────────────────────────────────────────────────────
// Returns aggregated token usage from Supabase token_usage table.
// ── POST /api/token-usage ─────────────────────────────────────────────────────
// Records a single token usage entry. Called by ai-client after every LLM call.

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

  const totals = {
    inputTokens:          0, outputTokens: 0, cacheReadTokens: 0,
    cacheCreationTokens:  0, totalTokens: 0, costUsd: 0, requests: rows.length,
  }

  const byAgent:  Record<string, { agentId: string; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd: number; requests: number }> = {}
  const byRoute:  Record<string, { route: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }> = {}
  const byModel:  Record<string, { model: string; inputTokens: number; outputTokens: number; costUsd: number; requests: number }> = {}

  const dailyMap: Record<string, { date: string; inputTokens: number; outputTokens: number; costUsd: number }> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    dailyMap[d] = { date: d, inputTokens: 0, outputTokens: 0, costUsd: 0 }
  }

  for (const row of rows) {
    totals.inputTokens         += row.input_tokens; totals.outputTokens        += row.output_tokens
    totals.cacheReadTokens     += row.cache_read_tokens; totals.cacheCreationTokens += row.cache_creation_tokens
    totals.totalTokens         += row.input_tokens + row.output_tokens; totals.costUsd += row.cost_usd

    const aid = row.agent_id ?? 'unknown'
    if (!byAgent[aid]) byAgent[aid] = { agentId: aid, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0, requests: 0 }
    byAgent[aid].inputTokens += row.input_tokens; byAgent[aid].outputTokens += row.output_tokens
    byAgent[aid].cacheReadTokens += row.cache_read_tokens; byAgent[aid].costUsd += row.cost_usd; byAgent[aid].requests += 1

    const rt = row.route ?? 'unknown'
    if (!byRoute[rt]) byRoute[rt] = { route: rt, inputTokens: 0, outputTokens: 0, costUsd: 0, requests: 0 }
    byRoute[rt].inputTokens += row.input_tokens; byRoute[rt].outputTokens += row.output_tokens
    byRoute[rt].costUsd += row.cost_usd; byRoute[rt].requests += 1

    const mdl = row.model ?? 'unknown'
    if (!byModel[mdl]) byModel[mdl] = { model: mdl, inputTokens: 0, outputTokens: 0, costUsd: 0, requests: 0 }
    byModel[mdl].inputTokens += row.input_tokens; byModel[mdl].outputTokens += row.output_tokens
    byModel[mdl].costUsd += row.cost_usd; byModel[mdl].requests += 1

    const day = row.created_at?.slice(0, 10)
    if (day && dailyMap[day]) { dailyMap[day].inputTokens += row.input_tokens; dailyMap[day].outputTokens += row.output_tokens; dailyMap[day].costUsd += row.cost_usd }
  }

  const cacheHitRate = totals.inputTokens > 0
    ? Math.round((totals.cacheReadTokens / (totals.inputTokens + totals.cacheReadTokens)) * 100) : 0

  return Response.json({
    days, totals: { ...totals, costUsd: Math.round(totals.costUsd * 10000) / 10000 },
    cacheHitRate,
    byAgent:  Object.values(byAgent).sort((a, b) => b.costUsd - a.costUsd),
    byRoute:  Object.values(byRoute).sort((a, b) => b.costUsd - a.costUsd),
    byModel:  Object.values(byModel).sort((a, b) => b.costUsd - a.costUsd),
    daily:    Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    hasData:  rows.length > 0,
  })
}

// ─── POST /api/token-usage — Record a single usage entry ──────────────────────

interface PostBody {
  agentId?: string
  route?: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  costUsd?: number
  ventureId?: string
}

export async function POST(request: Request): Promise<Response> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ recorded: false, reason: 'Supabase not configured' }, { status: 200 })
  }

  try {
    const body = await request.json() as PostBody
    if (!body.model) return Response.json({ error: 'model is required' }, { status: 400 })

    const row = {
      agent_id:              body.agentId ?? null,
      route:                 body.route ?? 'unknown',
      model:                 body.model,
      input_tokens:          body.inputTokens ?? 0,
      output_tokens:         body.outputTokens ?? 0,
      cache_read_tokens:     body.cacheReadTokens ?? 0,
      cache_creation_tokens: body.cacheCreationTokens ?? 0,
      cost_usd:              body.costUsd ?? 0,
      venture_id:            body.ventureId ?? null,
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        apikey:        supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify(row),
    })

    return Response.json({ recorded: res.ok, status: res.status })
  } catch (e) {
    return Response.json({ recorded: false, error: String(e) }, { status: 200 })
  }
}
