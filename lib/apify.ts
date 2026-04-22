import 'server-only'
import type { InstagramStats, LinkedInStats } from '@/lib/types'

const APIFY_BASE = 'https://api.apify.com/v2'
const TOKEN = process.env.APIFY_TOKEN!

// Actor IDs from Apify Store
const ACTORS = {
  instagram: 'apify~instagram-profile-scraper',
  linkedin:  'apimaestro~linkedin-profile-scraper',
  web:       'apify~web-scraper',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function startRun(actorId: string, input: Record<string, unknown>): Promise<string> {
  const res = await fetch(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${TOKEN}`,
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
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${TOKEN}`)
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
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${TOKEN}`)
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
