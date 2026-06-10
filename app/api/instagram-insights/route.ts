/**
 * POST /api/instagram-insights
 *
 * Enriches social_posts with real reach, saves, and shares from the
 * Facebook Graph API. Called after Apify scraping or on-demand from the
 * Social Media analytics page.
 *
 * Body: { ventureSlug: string, handle?: string }
 *
 * Requires FACEBOOK_GRAPH_TOKEN in Supabase Vault.
 */

import { supabase } from '@/lib/supabase'
import {
  isFacebookGraphConfigured,
  enrichPostsWithGraphData,
} from '@/lib/facebook-graph'

interface EnrichBody {
  ventureSlug: string
  handle?: string
}

interface PostRow {
  id: string
  post_id: string
  venture_slug: string
}

export async function POST(request: Request): Promise<Response> {
  // Check if Facebook Graph is configured
  const configured = await isFacebookGraphConfigured()
  if (!configured) {
    return Response.json({
      enriched: 0,
      message: 'Facebook Graph API not configured. Add FACEBOOK_GRAPH_TOKEN to Supabase Vault.',
      setup: true,
    }, { status: 200 })
  }

  let body: EnrichBody
  try {
    body = await request.json() as EnrichBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ventureSlug, handle } = body
  if (!ventureSlug) {
    return Response.json({ error: 'ventureSlug is required' }, { status: 400 })
  }

  // Fetch posts that need enrichment: Instagram posts with reach=0 from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  let query = supabase
    .from('social_posts')
    .select('id, post_id, venture_slug')
    .eq('venture_slug', ventureSlug)
    .eq('platform', 'instagram')
    .eq('reach', 0)
    .gte('published_at', thirtyDaysAgo)
    .order('published_at', { ascending: false })
    .limit(25)

  if (handle) {
    query = query.eq('handle', handle)
  }

  const { data: posts, error } = await query

  if (error) {
    return Response.json({ error: `DB query failed: ${error.message}` }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return Response.json({
      enriched: 0,
      message: 'No posts need enrichment. All recent posts already have reach data, or no Instagram posts found.',
      postCount: 0,
    })
  }

  // Enrich via Facebook Graph API
  const result = await enrichPostsWithGraphData(posts as PostRow[])

  return Response.json({
    enriched: result.enriched,
    total: posts.length,
    errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
    message: `Enriched ${result.enriched}/${posts.length} posts${result.errors.length > 0 ? ` (${result.errors.length} errors)` : ''}`,
  })
}

export async function GET(request: Request): Promise<Response> {
  const configured = await isFacebookGraphConfigured()

  return Response.json({
    configured,
    message: configured
      ? 'Facebook Graph API is configured and ready.'
      : 'Facebook Graph API not configured. Add FACEBOOK_GRAPH_TOKEN to Supabase Vault.',
  })
}
