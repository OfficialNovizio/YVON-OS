import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  CompetitorContent,
} from '@/lib/types'

// ─── Competitor Content ───────────────────────────────────────────────────────

export async function getCompetitorContent(
  ventureId: string,
  platform: string
): Promise<CompetitorContent[]> {
  const { data } = await supabase
    .from('competitor_content')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .order('fetched_at', { ascending: false })
    .limit(20)
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    platform: r.platform,
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    engagementHint: r.engagement_hint ?? undefined,
    sourceUrl: r.source_url ?? undefined,
    fetchedAt: r.fetched_at,
  }))
}

export async function upsertCompetitorContent(
  items: Omit<CompetitorContent, 'id'>[]
): Promise<void> {
  if (items.length === 0) return
  await supabase.from('competitor_content').insert(
    items.map((item) => ({
      venture_id: item.ventureId,
      platform: item.platform,
      title: item.title ?? null,
      description: item.description ?? null,
      engagement_hint: item.engagementHint ?? null,
      source_url: item.sourceUrl ?? null,
      fetched_at: item.fetchedAt,
    }))
  )
}
