// GET /api/content-feed?type=pipeline|scheduler|social&venture=x
// Unified content API — serves Content Pipeline, Scheduler, and Social Analytics pages.
// All read from Supabase social_posts and content_calendar tables.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ContentItem {
  id: string
  title: string
  type: 'post' | 'short' | 'video' | 'newsletter'
  stage: string
  platform: string | null
  status: string
  scheduledFor: string | null
  createdAt: string
  ventureSlug: string | null
  caption: string | null
  imageUrl: string | null
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') ?? 'all'
  const venture = url.searchParams.get('venture') ?? null

  try {
    // Fetch from social_posts
    let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false }).limit(30)
    if (venture) query = query.eq('venture_slug', venture)

    const { data: posts, error } = await query

    if (error) {
      // Graceful mock fallback
      return Response.json({ items: MOCK_ITEMS, total: MOCK_ITEMS.length, source: 'mock' })
    }

    const items: ContentItem[] = (posts ?? []).map((p) => ({
      id: p.id,
      title: p.title ?? 'Untitled',
      type: 'post',
      stage: p.status === 'published' ? 'published' : p.status === 'needs_review' ? 'review' : 'draft',
      platform: p.platform ?? 'instagram',
      status: p.status ?? 'draft',
      scheduledFor: p.scheduled_for ?? null,
      createdAt: p.created_at,
      ventureSlug: p.venture_slug ?? null,
      caption: p.caption ?? null,
      imageUrl: p.image_url ?? null,
    }))

    // Filter by type if requested
    const filtered = type === 'all' ? items : items.filter((i) => {
      if (type === 'pipeline') return i.stage !== 'published'
      if (type === 'scheduler') return i.scheduledFor !== null
      if (type === 'social') return true
      return true
    })

    return Response.json({ items: filtered, total: filtered.length, source: 'live' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ items: MOCK_ITEMS, total: MOCK_ITEMS.length, source: 'mock', error: msg }, { status: 500 })
  }
}

// ── Mock data (when Supabase is unavailable) ──────────────────────────────────
const MOCK_ITEMS: ContentItem[] = [
  { id: 'm1', title: 'Novizio summer collection teaser', type: 'post', stage: 'review', platform: 'instagram', status: 'needs_review', scheduledFor: null, createdAt: new Date().toISOString(), ventureSlug: 'novizio', caption: 'Summer is coming. Are you ready? 🌊 #NovizioSummer', imageUrl: null },
  { id: 'm2', title: 'Hourbour fintech explainer', type: 'video', stage: 'scripting', platform: 'youtube', status: 'draft', scheduledFor: null, createdAt: new Date().toISOString(), ventureSlug: 'hourbour', caption: 'How Hourbour saves you 10+ hours/week on invoicing', imageUrl: null },
  { id: 'm3', title: 'Behind the scenes — agent team', type: 'short', stage: 'editing', platform: 'tiktok', status: 'draft', scheduledFor: null, createdAt: new Date().toISOString(), ventureSlug: 'novizio', caption: '13 agents. One mission. Zero sleep. 🤖', imageUrl: null },
  { id: 'm4', title: 'Monthly newsletter #4', type: 'newsletter', stage: 'compose', platform: null, status: 'draft', scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString(), ventureSlug: 'novizio', caption: 'This month: AI agents, summer drops, and what we learned', imageUrl: null },
]
