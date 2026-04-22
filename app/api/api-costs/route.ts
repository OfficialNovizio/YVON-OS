import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

interface CostRow {
  model: string
  route: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cost_usd: number
  created_at: string
}

interface ModelAggregate {
  calls: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  costUsd: number
}

export async function GET(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const _ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '7', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)

  try {
    const { data, error } = await supabase
      .from('token_usage')
      .select('model, route, input_tokens, output_tokens, cache_read_tokens, cost_usd, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []) as CostRow[]

    const byModel: Record<string, ModelAggregate> = {}
    let totalCost = 0

    for (const row of rows) {
      const m = row.model
      if (!byModel[m]) {
        byModel[m] = { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0 }
      }
      byModel[m].calls++
      byModel[m].inputTokens     += row.input_tokens ?? 0
      byModel[m].outputTokens    += row.output_tokens ?? 0
      byModel[m].cacheReadTokens += row.cache_read_tokens ?? 0
      byModel[m].costUsd         += row.cost_usd ?? 0
      totalCost                  += row.cost_usd ?? 0
    }

    return Response.json({
      period: `last_${days}_days`,
      totalCostUsd: Math.round(totalCost * 10000) / 10000,
      totalCalls: rows.length,
      byModel,
      since: since.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
