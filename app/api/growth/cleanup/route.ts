import { supabase } from '@/lib/supabase'

// POST /api/growth/cleanup
// Deletes snapshot rows older than 90 days from all three snapshot tables.
// Protected by CRON_SECRET. Add to vercel.json cron: "0 3 * * 1" (Monday 3am UTC).
export async function POST(request: Request): Promise<Response> {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (cronSecret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase.rpc('cleanup_old_snapshots')
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
