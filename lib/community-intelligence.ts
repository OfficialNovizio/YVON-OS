// Community Intelligence — Reddit, TikTok comments, Discord signals
import 'server-only'
import { supabase } from '@/lib/supabase'

export async function getCommunitySignals(ventureId: string, source?: string): Promise<
  Array<{
    id: string
    ventureId: string
    source: string
    topic: string | null
    sentiment: string | null
    extractedDesire: string | null
    frequency: number
    sourceUrl: string | null
    detectedAt: string
  }>
> {
  let q = supabase.from('community_signals').select('*').eq('venture_id', ventureId).order('frequency', { ascending: false }).limit(50)
  if (source) q = q.eq('source', source)
  const { data } = await q
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    source: r.source,
    topic: (r.topic as string | null) ?? null,
    sentiment: (r.sentiment as string | null) ?? null,
    extractedDesire: (r.extracted_desire as string | null) ?? null,
    frequency: r.frequency ?? 1,
    sourceUrl: (r.source_url as string | null) ?? null,
    detectedAt: r.detected_at,
  }))
}

export async function upsertCommunitySignal(signal: {
  ventureId: string
  source: string
  topic?: string
  sentiment?: string
  extractedDesire?: string
  sourceUrl?: string
}): Promise<void> {
  await supabase.from('community_signals').upsert({
    venture_id: signal.ventureId,
    source: signal.source,
    topic: signal.topic ?? null,
    sentiment: signal.sentiment ?? null,
    extracted_desire: signal.extractedDesire ?? null,
    source_url: signal.sourceUrl ?? null,
    frequency: 1,
    detected_at: new Date().toISOString(),
  })
}
