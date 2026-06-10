/**
 * lib/facebook-graph.ts — Facebook Graph API client for Instagram Business insights.
 *
 * Provides reach, impressions, shares, and saves that the public Apify scraper
 * cannot access. Requires a Facebook Page Access Token with:
 *   - instagram_basic
 *   - instagram_manage_insights
 *   - pages_show_list
 *   - pages_read_engagement
 *
 * Token stored in Supabase Vault as FACEBOOK_GRAPH_TOKEN.
 *
 * API reference: https://developers.facebook.com/docs/instagram-api/
 */

import 'server-only'
import { getSecret } from '@/lib/secrets'
import { supabase } from '@/lib/supabase'

const GRAPH_API = 'https://graph.facebook.com/v19.0'

export interface IGInsights {
  reach: number
  impressions: number
  saved: number
  shares?: number
  video_views?: number
}

interface IGMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  permalink?: string
  insights?: { data: Array<{ name: string; values: Array<{ value: number }> }> }
}

/** Cache for the IG business account ID — fetched once per process. */
let _cachedIgAccountId: string | null = null
let _cachedIgAccountAt = 0
const IG_ACCOUNT_CACHE_MS = 300_000 // 5 min

// ── Token ──────────────────────────────────────────────────────────────────────

async function getGraphToken(): Promise<string> {
  const token = await getSecret('FACEBOOK_GRAPH_TOKEN')
  if (!token) throw new Error('FACEBOOK_GRAPH_TOKEN not set in Supabase Vault')
  return token
}

// ── Core API call ──────────────────────────────────────────────────────────────

async function graphGet(path: string, token: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(`${GRAPH_API}${path}`)
  url.searchParams.set('access_token', token)
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Facebook Graph API ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

// ── Instagram Business Account ─────────────────────────────────────────────────

interface PageNode {
  id: string
  name: string
  instagram_business_account?: { id: string }
}

export async function getInstagramBusinessAccountId(): Promise<string> {
  if (_cachedIgAccountId && Date.now() - _cachedIgAccountAt < IG_ACCOUNT_CACHE_MS) {
    return _cachedIgAccountId
  }

  const token = await getGraphToken()

  // Step 1: List Facebook Pages the token has access to
  const pagesData = await graphGet('/me/accounts', token, {
    fields: 'id,name,instagram_business_account{id}',
  }) as { data: PageNode[] }

  // Step 2: Find first page with an Instagram Business account
  for (const page of pagesData.data ?? []) {
    if (page.instagram_business_account?.id) {
      _cachedIgAccountId = page.instagram_business_account.id
      _cachedIgAccountAt = Date.now()
      return _cachedIgAccountId
    }
  }

  throw new Error(
    'No Instagram Business account found. Ensure your Instagram account is:\n' +
    '1. Converted to Business or Creator account\n' +
    '2. Linked to a Facebook Page you admin\n' +
    '3. Connected in Facebook Business Settings → Instagram Accounts'
  )
}

// ── Fetch recent media ─────────────────────────────────────────────────────────

export async function getRecentMedia(limit = 10): Promise<IGMedia[]> {
  const token = await getGraphToken()
  const igAccountId = await getInstagramBusinessAccountId()

  const data = await graphGet(`/${igAccountId}/media`, token, {
    fields: 'id,caption,media_type,timestamp,permalink',
    limit: String(limit),
  }) as { data: IGMedia[] }

  return data.data ?? []
}

// ── Get insights for a single media ────────────────────────────────────────────

export async function getMediaInsights(mediaId: string): Promise<IGInsights> {
  const token = await getGraphToken()

  const metrics = 'reach,impressions,saved'
  const data = await graphGet(`/${mediaId}/insights`, token, {
    metric: metrics,
  }) as { data: Array<{ name: string; values: Array<{ value: number }> }> }

  const result: IGInsights = { reach: 0, impressions: 0, saved: 0 }

  for (const metric of data.data ?? []) {
    const value = metric.values?.[0]?.value ?? 0
    if (metric.name === 'reach') result.reach = value
    if (metric.name === 'impressions') result.impressions = value
    if (metric.name === 'saved') result.saved = value
  }

  return result
}

// ── Batch enrichment: update social_posts with real Graph API data ─────────────

interface PostToEnrich {
  id: string          // social_posts UUID
  post_id: string     // Instagram media ID
  venture_slug: string
}

export async function enrichPostsWithGraphData(posts: PostToEnrich[]): Promise<{
  enriched: number
  errors: string[]
}> {
  const errors: string[] = []
  let enriched = 0

  for (const post of posts) {
    try {
      const insights = await getMediaInsights(post.post_id)

      const { error } = await supabase
        .from('social_posts')
        .update({
          reach: insights.reach,
          saves: insights.saved,
          shares: insights.shares ?? 0,
        })
        .eq('id', post.id)

      if (error) {
        errors.push(`${post.post_id}: DB update failed — ${error.message}`)
      } else {
        enriched++
      }

      // Rate limit: Facebook Graph API allows ~200 calls/hour per token on basic tier
      await new Promise(r => setTimeout(r, 300))
    } catch (e) {
      errors.push(`${post.post_id}: ${String(e)}`)
    }
  }

  return { enriched, errors }
}

// ── Check if configured ────────────────────────────────────────────────────────

export async function isFacebookGraphConfigured(): Promise<boolean> {
  try {
    const token = await getGraphToken()
    return !!token
  } catch {
    return false
  }
}
