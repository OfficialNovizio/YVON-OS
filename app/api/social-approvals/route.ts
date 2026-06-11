// GET  /api/social-approvals?venture=x — posts awaiting review
// POST /api/social-approvals          — approve/reject/defer a post
//
// Queries social_posts table in Supabase for posts needing CEO review.
// Wired from YVON 2.0's social_posts pipeline.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SocialPost {
  id: string
  title: string
  platform: string
  caption: string | null
  image_url: string | null
  status: string
  venture_slug: string | null
  created_at: string
  scheduled_for: string | null
  // A/B copy variants (mock for now, real generation via William later)
  variant_a?: string | null
  variant_b?: string | null
  image_count?: number
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const venture = url.searchParams.get('venture') ?? null

  try {
    let query = supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'needs_review')
      .order('created_at', { ascending: false })
      .limit(12)

    if (venture) {
      query = query.eq('venture_slug', venture)
    }

    const { data: posts, error } = await query

    if (error) {
      return Response.json({ error: error.message, posts: [] }, { status: 500 })
    }

    // Enrich with mock A/B copy for demo (real William generation in Phase 3)
    const enriched = (posts ?? []).map((p) => ({
      ...p,
      variant_a: p.variant_a ?? p.caption?.slice(0, 150) ?? 'Variant A copy pending',
      variant_b: p.variant_b ?? `${p.caption?.slice(0, 80) ?? 'Alt copy'} — swipe up to see more.`,
      image_count: p.image_count ?? 8,
    }))

    return Response.json({ posts: enriched, total: enriched.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, posts: [] }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return Response.json({ error: 'id and action required' }, { status: 400 })
    }

    if (!['approve', 'reject', 'defer'].includes(action)) {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if (action === 'approve') {
      update.status = 'approved'
      update.approved_at = new Date().toISOString()
    } else if (action === 'reject') {
      update.status = 'dismissed'
      update.dismissed_at = new Date().toISOString()
    } else {
      update.status = 'deferred'
      update.deferred_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const { error } = await supabase
      .from('social_posts')
      .update(update)
      .eq('id', id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, id, action })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
