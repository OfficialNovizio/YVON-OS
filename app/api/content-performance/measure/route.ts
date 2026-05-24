// T+7 Measurement Cron — runs daily at 10:00 UTC
// Finds posts that went live ≥7 days ago with no measurement yet.
// Returns summary for monitoring; actual measurement requires user input via the UI
// (we don't auto-classify without real metric data).

import { cookies } from 'next/headers'
import { getSecret } from '@/lib/secrets'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

export async function GET(request: Request): Promise<Response> {
  // Auth: cron calls use CRON_SECRET header; browser calls rely on middleware yvon_auth gate
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  const isCron = Boolean(await getSecret('CRON_SECRET')) && cronSecret === await getSecret('CRON_SECRET')

  if (!isCron && !request.headers.get('cookie')?.includes('yvon_auth')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const slug = isCron
    ? 'novizio'
    : (cookieStore.get('yvon_active_venture')?.value ?? 'novizio')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: pending, error } = await supabase
    .from('content_performance')
    .select('id, platform, format, signal_type, posted_at')
    .eq('venture_slug', slug)
    .is('measured_at', null)
    .lte('posted_at', sevenDaysAgo)
    .order('posted_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const count = (pending ?? []).length

  // Surface in the UI as a badge / notification — no auto-measurement without real metrics
  return Response.json({
    pendingCount: count,
    pending: pending ?? [],
    message: count > 0
      ? `${count} post${count > 1 ? 's' : ''} ready to measure — open Marketing > Content to record results`
      : 'No posts pending measurement',
    checkedAt: new Date().toISOString(),
  })
}
