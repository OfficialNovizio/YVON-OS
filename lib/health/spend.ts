/** Spend tracking — AI token costs, Supabase usage, Vercel spend */
import { createClient } from '@supabase/supabase-js'

export interface SpendResult {
  status: 'pass' | 'fail' | 'warn'
  details: Record<string, { status: string; value: any }>
  totals: { monthToDate: number; dailyBurn: number; projectedMonth: number }
}

export async function checkSpend(): Promise<SpendResult> {
  const details: Record<string, { status: string; value: any }> = {}
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Token costs
  if (url && key) {
    try {
      const supabase = createClient(url, key)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: tokenRows } = await supabase
        .from('token_usage')
        .select('cost_usd, created_at')
        .gte('created_at', thirtyDaysAgo)

      if (tokenRows && tokenRows.length > 0) {
        const totalCost = tokenRows.reduce((sum, r) => sum + (r.cost_usd || 0), 0)
        const days = 30
        const dailyBurn = totalCost / days
        const projectedMonth = dailyBurn * 30
        details.aiTokens = { status: projectedMonth < 200 ? 'pass' : projectedMonth < 500 ? 'warn' : 'fail', value: `$${totalCost.toFixed(2)} last 30d · ~$${projectedMonth.toFixed(0)}/mo projected` }
        return { status: 'pass', details, totals: { monthToDate: totalCost, dailyBurn, projectedMonth } }
      }
      details.aiTokens = { status: 'warn', value: 'No token data found' }
    } catch (e: any) {
      details.aiTokens = { status: 'warn', value: e?.message ?? 'Could not fetch token data' }
    }
  } else {
    details.aiTokens = { status: 'warn', value: 'Supabase not configured' }
  }

  return { status: 'warn', details, totals: { monthToDate: 0, dailyBurn: 0, projectedMonth: 0 } }
}
