import { getAllVentures, getPastDuePlanned, getCachedPosts, upsertCachedPosts, markAsPosted, markAsMissed } from '@/lib/db'
import { scrapeInstagramPosts, scrapeTikTokPosts, scrapeLinkedInPosts } from '@/lib/apify'
import { jaccardSimilarity } from '@/lib/similarity'
import type { ContentCalendarEntry, VentureConfig } from '@/lib/types'

const SIMILARITY_THRESHOLD = 0.4

type PlatformHandle = { platform: 'IG' | 'TT' | 'LI'; handle: string }

function getVentureHandles(venture: VentureConfig): PlatformHandle[] {
  const handles: PlatformHandle[] = []
  if (venture.igHandle) {
    handles.push({ platform: 'IG', handle: venture.igHandle })
    // TikTok handle — reuse igHandle as fallback until ventures table has tiktok_handle
    handles.push({ platform: 'TT', handle: venture.igHandle })
  }
  if (venture.liProfileUrl) {
    handles.push({ platform: 'LI', handle: venture.liProfileUrl })
  }
  return handles
}

async function scrapeForPlatform(platform: 'IG' | 'TT' | 'LI', handle: string) {
  switch (platform) {
    case 'IG': return scrapeInstagramPosts(handle)
    case 'TT': return scrapeTikTokPosts(handle)
    case 'LI': return scrapeLinkedInPosts(handle)
  }
}

function findBestMatch(
  entry: ContentCalendarEntry,
  posts: { caption?: string; postUrl?: string }[]
): { postUrl: string; score: number } | null {
  const searchText = [entry.headline, entry.brief].filter(Boolean).join(' ')
  let best: { postUrl: string; score: number } | null = null

  for (const post of posts) {
    if (!post.caption || !post.postUrl) continue
    const score = jaccardSimilarity(searchText, post.caption)
    if (!best || score > best.score) {
      best = { postUrl: post.postUrl, score }
    }
  }
  return best
}

async function verifyVenture(venture: VentureConfig) {
  let verified = 0
  let missed = 0
  let newPosts = 0

  const handles = getVentureHandles(venture)
  const pastDue = await getPastDuePlanned(venture.id)

  for (const { platform, handle } of handles) {
    // Step 1: Scrape posts
    let scrapedPosts
    try {
      scrapedPosts = await scrapeForPlatform(platform, handle)
    } catch {
      continue // skip platform on failure
    }

    // Step 2: Cache them
    if (scrapedPosts.length > 0) {
      await upsertCachedPosts(
        scrapedPosts.map((p) => ({
          ventureId: venture.id,
          platform,
          postUrl: p.postUrl,
          caption: p.caption,
          postDate: p.postDate,
          mediaType: p.mediaType,
        }))
      )
      newPosts += scrapedPosts.length
    }

    // Step 3: Match past-due entries for this platform
    const platformEntries = pastDue.filter((e) => e.platform === platform)
    for (const entry of platformEntries) {
      const entryDate = new Date(entry.planDate)
      const startDate = new Date(entryDate)
      startDate.setDate(startDate.getDate() - 2)
      const endDate = new Date(entryDate)
      endDate.setDate(endDate.getDate() + 2)

      const cachedPosts = await getCachedPosts(
        venture.id,
        platform,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )

      const match = findBestMatch(entry, cachedPosts)
      if (match && match.score >= SIMILARITY_THRESHOLD) {
        await markAsPosted(entry.id, match.postUrl)
        verified++
      } else {
        await markAsMissed(entry.id)
        missed++
      }
    }
  }

  return { verified, missed, newPosts }
}

// GET = Vercel Cron (weekly)
export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN not set' }, { status: 500 })
  }

  const ventures = await getAllVentures()
  const results: Record<string, { verified: number; missed: number; newPosts: number }> = {}

  for (const venture of ventures) {
    results[venture.id] = await verifyVenture(venture)
  }

  return Response.json({ results })
}

// POST = Manual trigger from UI
export async function POST(request: Request): Promise<Response> {
  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN not set' }, { status: 500 })
  }

  let body: { ventureId?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    body = {}
  }

  const ventures = await getAllVentures()
  const filtered = body.ventureId
    ? ventures.filter((v) => v.id === body.ventureId)
    : ventures

  const results: Record<string, { verified: number; missed: number; newPosts: number }> = {}
  for (const venture of filtered) {
    results[venture.id] = await verifyVenture(venture)
  }

  return Response.json({ results })
}
