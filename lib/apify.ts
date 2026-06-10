import 'server-only'
import type { InstagramStats, LinkedInStats } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const APIFY_BASE = 'https://api.apify.com/v2'

// Free-plan budget: cache everything for 24h, max 10 posts per run
const MAX_POSTS = 10
const CACHE_TTL_HOURS = 24

// Read from Supabase Vault (encrypted at rest, service-role only).
// Accepts either secret name: the newer `apify_api_key`, or `APIFY_TOKEN`
// (the key every other Apify route + the Settings UI use). getSecret checks
// the Vault then the matching env var for each name.
import { getSecret } from '@/lib/secrets'

export async function getToken(): Promise<string> {
  const token = (await getSecret('apify_api_key')) ?? (await getSecret('APIFY_TOKEN'))
  if (!token) {
    throw new Error('Apify token not set — add `apify_api_key` or `APIFY_TOKEN` in Vault or env')
  }
  return token
}

export async function isApifyConfigured(): Promise<boolean> {
  try {
    const token = await getToken()
    return !!token
  } catch {
    return false
  }
}

// ── Types (new analytics helpers) ─────────────────────────────────────────────

export interface SocialMetrics {
  platform:        'instagram' | 'tiktok' | 'linkedin' | 'youtube'
  handle:          string
  followers:       number
  following:       number
  posts_count:     number
  avg_likes:       number
  avg_comments:    number
  avg_views:       number
  engagement_rate: number  // decimal e.g. 0.034 = 3.4%
  fetched_at:      string
  from_cache:      boolean
}

export interface SocialPost {
  post_id:         string
  url:             string
  thumbnail_url:   string
  caption:         string
  post_type:       string
  likes:           number
  comments:        number
  shares:          number
  saves:           number
  views:           number
  reach:           number
  engagement_rate: number
  published_at:    string
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function getCachedSnapshot(ventureSlug: string, platform: string, handle: string) {
  const { data } = await supabase
    .from('social_snapshots')
    .select('*')
    .eq('venture_slug', ventureSlug)
    .eq('platform', platform)
    .eq('handle', handle)
    .gt('cache_expires_at', new Date().toISOString())
    .order('captured_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function upsertSnapshot(
  ventureSlug: string,
  platform: string,
  handle: string,
  metrics: Omit<SocialMetrics, 'platform' | 'handle' | 'fetched_at' | 'from_cache'>,
  rawData: unknown,
) {
  const now     = new Date()
  const expires = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)
  await supabase.from('social_snapshots').upsert({
    venture_id:       ventureSlug,
    venture_slug:     ventureSlug,
    platform,
    handle,
    captured_at:      now.toISOString(),
    cache_expires_at: expires.toISOString(),
    followers:        metrics.followers,
    following:        metrics.following,
    posts_count:      metrics.posts_count,
    avg_likes:        metrics.avg_likes,
    avg_comments:     metrics.avg_comments,
    avg_views:        metrics.avg_views,
    engagement_rate:  metrics.engagement_rate,
    data:             rawData,
  }, { onConflict: 'venture_slug,platform,handle' })
}

async function upsertPosts(ventureSlug: string, platform: string, posts: SocialPost[]) {
  if (!posts.length) return
  const rows = posts.map(p => ({
    venture_slug:    ventureSlug,
    platform,
    post_id:         p.post_id,
    url:             p.url,
    thumbnail_url:   p.thumbnail_url,
    caption:         p.caption.slice(0, 500),
    post_type:       p.post_type,
    likes:           p.likes,
    comments:        p.comments,
    shares:          p.shares,
    saves:           p.saves,
    views:           p.views,
    reach:           p.reach,
    engagement_rate: p.engagement_rate,
    published_at:    p.published_at,
  }))
  const { error } = await supabase.from('social_posts').upsert(rows, { onConflict: 'venture_slug,platform,post_id' })
  // Resilience: if migration 048 (thumbnail_url) hasn't run yet, retry without that column.
  if (error && /thumbnail_url/.test(error.message)) {
    const rowsNoThumb = rows.map(({ thumbnail_url: _omit, ...rest }) => rest)
    await supabase.from('social_posts').upsert(rowsNoThumb, { onConflict: 'venture_slug,platform,post_id' })
  }
}

// ── Sync actor runner (cheaper than async start/poll on free plan) ─────────────

async function runActorSync(token: string, actorId: string, input: Record<string, unknown>): Promise<unknown[]> {
  const url = `${APIFY_BASE}/acts/${actorId}/run-sync-get-dataset-items?token=${token}&memory=256`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`Apify actor ${actorId} failed (${res.status})`)
  const items = await res.json() as unknown[]
  return Array.isArray(items) ? items : []
}

// ── Platform scrapers ─────────────────────────────────────────────────────────

export type ScraperResult = { metrics: Omit<SocialMetrics, 'platform' | 'handle' | 'fetched_at' | 'from_cache'>; posts: SocialPost[]; raw: unknown }

// Best-effort thumbnail/preview image from a scraped post item (field names vary by actor).
function pickThumb(v: Record<string, unknown>): string {
  for (const k of ['displayUrl', 'thumbnailUrl', 'thumbnail', 'coverUrl', 'cover', 'imageUrl', 'image']) {
    const val = v[k]
    if (typeof val === 'string' && val) return val
  }
  if (Array.isArray(v.images) && typeof v.images[0] === 'string') return v.images[0] as string
  return ''
}

export async function scrapeInstagramFull(token: string, handle: string): Promise<ScraperResult> {
  const items = await runActorSync(token, 'apify~instagram-profile-scraper', {
    usernames: [handle.replace('@', '')],
    resultsLimit: MAX_POSTS,
  })
  const p = (items[0] ?? {}) as Record<string, unknown>
  const pArr = (Array.isArray(p.latestPosts) ? p.latestPosts : []) as Record<string, unknown>[]
  const followers    = Number(p.followersCount ?? 0)
  const count        = pArr.length || 1
  const avg_likes    = pArr.reduce((s, v) => s + Number(v.likesCount ?? 0), 0) / count
  const avg_comments = pArr.reduce((s, v) => s + Number(v.commentsCount ?? 0), 0) / count
  return {
    metrics: { followers, following: Number(p.followsCount ?? 0), posts_count: Number(p.postsCount ?? 0), avg_likes, avg_comments, avg_views: 0, engagement_rate: followers > 0 ? (avg_likes + avg_comments) / followers : 0 },
    posts: pArr.slice(0, MAX_POSTS).map(v => ({
      post_id: String(v.id ?? v.shortCode ?? ''), url: String(v.url ?? ''), thumbnail_url: pickThumb(v), caption: String(v.caption ?? '').slice(0, 500),
      post_type: v.type === 'Video' ? 'reel' : v.type === 'Sidecar' ? 'carousel' : 'static',
      likes: Number(v.likesCount ?? 0), comments: Number(v.commentsCount ?? 0), shares: 0, saves: 0,
      // IG "views"/plays: prefer the unified play count, fall back to legacy video views. (Public only — accurate reach/views need Graph API Insights.)
      views: Number(v.videoPlayCount ?? v.igPlayCount ?? v.playCount ?? v.videoViewCount ?? 0), reach: 0,
      engagement_rate: followers > 0 ? (Number(v.likesCount ?? 0) + Number(v.commentsCount ?? 0)) / followers : 0,
      published_at: String(v.timestamp ?? new Date().toISOString()),
    })),
    raw: p,
  }
}

export async function scrapeTikTokFull(token: string, handle: string): Promise<ScraperResult> {
  const items = await runActorSync(token, 'clockworks~tiktok-profile-scraper', {
    profiles: [`https://www.tiktok.com/@${handle.replace('@', '')}`],
    resultsPerPage: MAX_POSTS,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
  })
  const p = (items[0] ?? {}) as Record<string, unknown>
  const vArr = (Array.isArray(p.videos) ? p.videos : []) as Record<string, unknown>[]
  const followers    = Number(p.fans ?? p.followerCount ?? 0)
  const count        = vArr.length || 1
  const avg_likes    = vArr.reduce((s, v) => s + Number(v.diggCount ?? 0), 0) / count
  const avg_comments = vArr.reduce((s, v) => s + Number(v.commentCount ?? 0), 0) / count
  const avg_views    = vArr.reduce((s, v) => s + Number(v.playCount ?? 0), 0) / count
  return {
    metrics: { followers, following: Number(p.following ?? 0), posts_count: Number(p.video ?? 0), avg_likes, avg_comments, avg_views, engagement_rate: avg_views > 0 ? (avg_likes + avg_comments) / avg_views : 0 },
    posts: vArr.slice(0, MAX_POSTS).map(v => ({
      post_id: String(v.id ?? ''), url: String(v.webVideoUrl ?? ''), thumbnail_url: pickThumb(v), caption: String(v.text ?? '').slice(0, 500),
      post_type: 'short',
      likes: Number(v.diggCount ?? 0), comments: Number(v.commentCount ?? 0), shares: Number(v.shareCount ?? 0), saves: Number(v.collectCount ?? 0),
      views: Number(v.playCount ?? 0), reach: 0,
      engagement_rate: Number(v.playCount ?? 1) > 0 ? (Number(v.diggCount ?? 0) + Number(v.commentCount ?? 0)) / Number(v.playCount ?? 1) : 0,
      published_at: new Date((Number(v.createTime ?? 0)) * 1000).toISOString(),
    })),
    raw: p,
  }
}

export async function scrapeLinkedInFull(token: string, handle: string): Promise<ScraperResult> {
  const url = handle.startsWith('http') ? handle : `https://www.linkedin.com/company/${handle}/`
  const items = await runActorSync(token, 'curious_coder~linkedin-company-scraper', { companies: [url], maxPosts: MAX_POSTS })
  const p = (items[0] ?? {}) as Record<string, unknown>
  const pArr = (Array.isArray(p.posts) ? p.posts : []) as Record<string, unknown>[]
  const followers    = Number(p.followersCount ?? p.followers ?? 0)
  const count        = pArr.length || 1
  const avg_likes    = pArr.reduce((s, v) => s + Number(v.likesCount ?? v.numLikes ?? 0), 0) / count
  const avg_comments = pArr.reduce((s, v) => s + Number(v.commentsCount ?? v.numComments ?? 0), 0) / count
  return {
    metrics: { followers, following: 0, posts_count: Number(p.postsCount ?? 0), avg_likes, avg_comments, avg_views: 0, engagement_rate: followers > 0 ? (avg_likes + avg_comments) / followers : 0 },
    posts: pArr.slice(0, MAX_POSTS).map(v => ({
      post_id: String(v.id ?? v.urn ?? ''), url: String(v.url ?? ''), thumbnail_url: pickThumb(v), caption: String(v.text ?? '').slice(0, 500),
      post_type: v.type === 'ARTICLE' ? 'article' : 'static',
      likes: Number(v.likesCount ?? v.numLikes ?? 0), comments: Number(v.commentsCount ?? v.numComments ?? 0), shares: Number(v.sharesCount ?? 0), saves: 0,
      views: Number(v.impressionsCount ?? 0), reach: 0,
      engagement_rate: followers > 0 ? (Number(v.likesCount ?? 0) + Number(v.commentsCount ?? 0)) / followers : 0,
      published_at: String(v.postedAt ?? v.date ?? new Date().toISOString()),
    })),
    raw: p,
  }
}

export async function scrapeYouTubeFull(token: string, handle: string): Promise<ScraperResult> {
  const q = handle.startsWith('UC') ? handle : `@${handle.replace(/^@/, '')}`
  const items = await runActorSync(token, 'bernardo_adinolfi~youtube-channel-scraper', {
    startUrls: [{ url: `https://www.youtube.com/${q}` }],
    maxVideos: MAX_POSTS,
  })
  const ch   = (items[0] ?? {}) as Record<string, unknown>
  const vArr = (Array.isArray(ch.videos) ? ch.videos : items.slice(1)) as Record<string, unknown>[]
  const followers = Number(ch.subscriberCount ?? ch.subscribers ?? 0)
  const count     = vArr.length || 1
  const avg_views = vArr.reduce((s, v) => s + Number(v.viewCount ?? v.views ?? 0), 0) / count
  const avg_likes = vArr.reduce((s, v) => s + Number(v.likeCount ?? v.likes ?? 0), 0) / count
  return {
    metrics: { followers, following: 0, posts_count: Number(ch.videoCount ?? 0), avg_likes, avg_comments: 0, avg_views, engagement_rate: avg_views > 0 ? avg_likes / avg_views : 0 },
    posts: vArr.slice(0, MAX_POSTS).map(v => ({
      post_id: String(v.id ?? v.videoId ?? ''), url: String(v.url ?? `https://youtube.com/watch?v=${v.id ?? ''}`),
      thumbnail_url: pickThumb(v), caption: String(v.title ?? '').slice(0, 500),
      post_type: Number(v.durationSeconds ?? 9999) < 60 ? 'short' : 'long video',
      likes: Number(v.likeCount ?? 0), comments: Number(v.commentCount ?? 0), shares: 0, saves: 0,
      views: Number(v.viewCount ?? v.views ?? 0), reach: 0,
      engagement_rate: Number(v.viewCount ?? 1) > 0 ? Number(v.likeCount ?? 0) / Number(v.viewCount ?? 1) : 0,
      published_at: String(v.publishedAt ?? v.date ?? new Date().toISOString()),
    })),
    raw: ch,
  }
}

// ── Public analytics API (cache-first) ───────────────────────────────────────

/**
 * Returns social metrics for a connected platform.
 * Cache-first — only calls Apify when cache is stale or forceRefresh=true.
 * Only pass forceRefresh=true on explicit user Refresh button click.
 */
export async function getSocialMetrics(
  ventureSlug: string,
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
  handle: string,
  forceRefresh = false,
): Promise<SocialMetrics> {
  if (!forceRefresh) {
    const cached = await getCachedSnapshot(ventureSlug, platform, handle)
    if (cached) {
      return {
        platform, handle,
        followers:       cached.followers       ?? 0,
        following:       cached.following        ?? 0,
        posts_count:     cached.posts_count      ?? 0,
        avg_likes:       Number(cached.avg_likes     ?? 0),
        avg_comments:    Number(cached.avg_comments  ?? 0),
        avg_views:       Number(cached.avg_views     ?? 0),
        engagement_rate: Number(cached.engagement_rate ?? 0),
        fetched_at:      cached.captured_at as string,
        from_cache:      true,
      }
    }
    // No cache and no explicit refresh — return empty metrics rather than
    // burning Apify credits on passive page loads.
    return {
      platform, handle,
      followers: 0, following: 0, posts_count: 0,
      avg_likes: 0, avg_comments: 0, avg_views: 0,
      engagement_rate: 0,
      fetched_at: new Date().toISOString(),
      from_cache: false,
    }
  }

  let token: string
  try {
    token = await getToken()
  } catch {
    return {
      platform, handle,
      followers: 0, following: 0, posts_count: 0,
      avg_likes: 0, avg_comments: 0, avg_views: 0,
      engagement_rate: 0,
      fetched_at: new Date().toISOString(),
      from_cache: false,
    }
  }

  let result: ScraperResult

  switch (platform) {
    case 'instagram': result = await scrapeInstagramFull(token, handle); break
    case 'tiktok':    result = await scrapeTikTokFull(token, handle);    break
    case 'linkedin':  result = await scrapeLinkedInFull(token, handle);  break
    case 'youtube':   result = await scrapeYouTubeFull(token, handle);   break
  }

  await upsertSnapshot(ventureSlug, platform, handle, result.metrics, result.raw)
  await upsertPosts(ventureSlug, platform, result.posts)

  // Auto-enrich Instagram posts with Facebook Graph API (reach, saves, shares)
  // Runs in background — doesn't block the scrape response.
  if (platform === 'instagram') {
    import('./facebook-graph').then(({ enrichPostsWithGraphData, isFacebookGraphConfigured }) => {
      isFacebookGraphConfigured().then(configured => {
        if (!configured) return
        // Query the posts we just saved to get their IDs
        supabase.from('social_posts')
          .select('id, post_id, venture_slug')
          .eq('venture_slug', ventureSlug)
          .eq('platform', 'instagram')
          .eq('reach', 0)
          .order('published_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data?.length) {
              enrichPostsWithGraphData(data as Parameters<typeof enrichPostsWithGraphData>[0])
                .catch(() => {})
            }
          })
          .then(undefined, () => {})
      })
    }).then(undefined, () => {})
  }

  return { platform, handle, ...result.metrics, fetched_at: new Date().toISOString(), from_cache: false }
}

/** Returns cached posts (populated by getSocialMetrics runs). Never calls Apify directly. */
export async function getSocialPosts(
  ventureSlug: string,
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube',
  limit = 10,
): Promise<SocialPost[]> {
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('venture_slug', ventureSlug)
    .eq('platform', platform)
    .order('published_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(r => ({
    post_id: r.post_id, url: r.url ?? '', thumbnail_url: r.thumbnail_url ?? '', caption: r.caption ?? '', post_type: r.post_type ?? 'static',
    likes: r.likes ?? 0, comments: r.comments ?? 0, shares: r.shares ?? 0, saves: r.saves ?? 0,
    views: r.views ?? 0, reach: r.reach ?? 0, engagement_rate: Number(r.engagement_rate ?? 0),
    published_at: r.published_at ?? new Date().toISOString(),
  }))
}

// Actor IDs from Apify Store
const ACTORS = {
  instagram: 'apify~instagram-profile-scraper',
  linkedin:  'apimaestro~linkedin-profile-scraper',
  web:       'apify~web-scraper',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function startRun(actorId: string, input: Record<string, unknown>): Promise<string> {
  const token = await getToken()
  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )
  if (!res.ok) throw new Error(`Apify run start failed: ${res.status}`)
  const json = await res.json() as { data: { id: string } }
  return json.data.id
}

async function waitForRun(runId: string, timeoutMs = 25000): Promise<string> {
  const token = await getToken()
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`)
    if (!res.ok) throw new Error(`Apify run poll failed: ${res.status}`)
    const json = await res.json() as { data: { status: string; defaultDatasetId: string } }
    if (json.data.status === 'SUCCEEDED') return json.data.defaultDatasetId
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(json.data.status)) {
      throw new Error(`Apify run ${json.data.status}`)
    }
  }
  throw new Error('Apify run timed out')
}

async function fetchDataset<T>(datasetId: string): Promise<T[]> {
  const token = await getToken()
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${token}`)
  if (!res.ok) throw new Error(`Apify dataset fetch failed: ${res.status}`)
  return res.json() as Promise<T[]>
}

// ─── Instagram ───────────────────────────────────────────────────────────────

interface ApifyInstagramItem {
  followersCount?: number
  followsCount?: number
  postsCount?: number
}

export async function runInstagramScraper(handle: string): Promise<InstagramStats> {
  const runId = await startRun(ACTORS.instagram, {
    usernames: [handle.replace('@', '')],
  })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyInstagramItem>(datasetId)
  const item = items[0] ?? {}
  return {
    followers: item.followersCount ?? 0,
    following: item.followsCount ?? 0,
    posts: item.postsCount ?? 0,
    lastFetched: new Date().toISOString(),
  }
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

interface ApifyLinkedInItem {
  followersCount?: number
  connectionsCount?: number
}

export async function runLinkedInScraper(profileUrl: string): Promise<LinkedInStats> {
  const runId = await startRun(ACTORS.linkedin, { profileUrls: [profileUrl] })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyLinkedInItem>(datasetId)
  const item = items[0] ?? {}
  return {
    followers: item.followersCount ?? 0,
    connections: item.connectionsCount ?? 0,
    lastFetched: new Date().toISOString(),
  }
}

// ─── Web Scraper ─────────────────────────────────────────────────────────────

interface ApifyWebItem {
  text?: string
}

export async function runWebScraper(url: string): Promise<string> {
  const runId = await startRun(ACTORS.web, {
    startUrls: [{ url }],
    maxPagesPerCrawl: 1,
  })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyWebItem>(datasetId)
  return items.map((i) => i.text ?? '').join('\n').slice(0, 8000)
}

// ─── Post-Level Scrapers (for calendar verification) ────────────────────────

interface ApifyInstagramPost {
  url?: string
  caption?: string
  timestamp?: string
  type?: string
}

interface ApifyTikTokPost {
  webVideoUrl?: string
  desc?: string
  createTimeISO?: string
}

interface ApifyLinkedInPost {
  url?: string
  text?: string
  postedAt?: string
}

export interface ScrapedPost {
  postUrl: string
  caption: string
  postDate: string
  mediaType: string
}

export async function scrapeInstagramPosts(handle: string): Promise<ScrapedPost[]> {
  const runId = await startRun('apify~instagram-scraper', {
    resultsType: 'posts',
    resultsLimit: 20,
    searchType: 'user',
    search: [handle.replace('@', '')],
  })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyInstagramPost>(datasetId)
  return items.map((item) => ({
    postUrl: item.url ?? '',
    caption: item.caption ?? '',
    postDate: item.timestamp ? item.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
    mediaType: item.type === 'Video' ? 'Reel' : item.type === 'Sidecar' ? 'Carousel' : 'Static',
  }))
}

export async function scrapeTikTokPosts(handle: string): Promise<ScrapedPost[]> {
  const runId = await startRun('clockworks~tiktok-scraper', {
    profiles: [handle.replace('@', '')],
    resultsPerPage: 20,
  })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyTikTokPost>(datasetId)
  return items.map((item) => ({
    postUrl: item.webVideoUrl ?? '',
    caption: item.desc ?? '',
    postDate: item.createTimeISO ? item.createTimeISO.split('T')[0] : new Date().toISOString().split('T')[0],
    mediaType: 'Short',
  }))
}

export async function scrapeLinkedInPosts(profileUrl: string): Promise<ScrapedPost[]> {
  const runId = await startRun('apimaestro~linkedin-profile-scraper', {
    profileUrls: [profileUrl],
    getPosts: true,
    postsLimit: 20,
  })
  const datasetId = await waitForRun(runId)
  const items = await fetchDataset<ApifyLinkedInPost>(datasetId)
  return items.map((item) => ({
    postUrl: item.url ?? '',
    caption: item.text ?? '',
    postDate: item.postedAt ? item.postedAt.split('T')[0] : new Date().toISOString().split('T')[0],
    mediaType: 'Post',
  }))
}
