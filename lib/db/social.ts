import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  InstagramStats,
  YouTubeStats,
  LinkedInStats,
  SocialPostCache,
  CalendarPlatform,
} from '@/lib/types'

// ─── Social Stats ─────────────────────────────────────────────────────────────

export async function getSocialStats(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin'
): Promise<InstagramStats | YouTubeStats | LinkedInStats | null> {
  const { data } = await supabase
    .from('social_stats')
    .select('data')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .single()
  return data?.data ?? null
}

export async function setSocialStats(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  stats: InstagramStats | YouTubeStats | LinkedInStats
): Promise<void> {
  await supabase.from('social_stats').upsert(
    { venture_id: ventureId, platform, data: stats, fetched_at: new Date().toISOString() },
    { onConflict: 'venture_id,platform' }
  )
}

// ─── Social Post Cache ────────────────────────────────────────────────────────

export async function getCachedPosts(
  ventureId: string,
  platform: string,
  startDate: string,
  endDate: string
): Promise<SocialPostCache[]> {
  const { data } = await supabase
    .from('social_posts_cache')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('post_date', startDate)
    .lte('post_date', endDate)
    .order('post_date', { ascending: false })

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    platform: r.platform as CalendarPlatform,
    postUrl: r.post_url ?? undefined,
    caption: r.caption ?? undefined,
    postDate: r.post_date,
    mediaType: r.media_type ?? undefined,
    scrapedAt: r.scraped_at,
  }))
}

export async function upsertCachedPosts(
  posts: Omit<SocialPostCache, 'id' | 'scrapedAt'>[]
): Promise<void> {
  if (posts.length === 0) return
  await supabase.from('social_posts_cache').upsert(
    posts.map((p) => ({
      venture_id: p.ventureId,
      platform: p.platform,
      post_url: p.postUrl ?? null,
      caption: p.caption ?? null,
      post_date: p.postDate,
      media_type: p.mediaType ?? null,
    })),
    { onConflict: 'venture_id,platform,post_url' }
  )
}
