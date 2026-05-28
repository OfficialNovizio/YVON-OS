/**
 * /api/social-stats
 *
 * GET  ?venture=novizio&platform=instagram&handle=novizio&refresh=false
 *      → Returns SocialMetrics (from cache or Apify)
 *
 * POST { venture, platforms: [{ platform, handle }], refresh? }
 *      → Returns metrics for multiple platforms in one request
 *
 * Budget rule: refresh=true only accepted when triggered by user action.
 * Page-load requests always use cache (refresh defaults to false).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSocialMetrics, getSocialPosts } from '@/lib/apify'

export const runtime = 'nodejs'
export const maxDuration = 130  // Apify sync runs can take up to 2 min

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const venture  = searchParams.get('venture')
  const platform = searchParams.get('platform') as 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | null
  const handle   = searchParams.get('handle')
  const refresh  = searchParams.get('refresh') === 'true'
  const posts    = searchParams.get('posts') === 'true'

  if (!venture || !platform || !handle) {
    return NextResponse.json({ error: 'Missing venture, platform, or handle' }, { status: 400 })
  }

  try {
    const [metrics, recentPosts] = await Promise.all([
      getSocialMetrics(venture, platform, handle, refresh),
      posts ? getSocialPosts(venture, platform, 10) : Promise.resolve([]),
    ])
    return NextResponse.json({ metrics, posts: recentPosts })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[social-stats GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  interface PlatformRequest {
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'youtube'
    handle: string
  }
  interface Body {
    venture: string
    platforms: PlatformRequest[]
    refresh?: boolean
    includePosts?: boolean
  }

  let body: Body
  try {
    body = await req.json() as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { venture, platforms, refresh = false, includePosts = false } = body
  if (!venture || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: 'Missing venture or platforms array' }, { status: 400 })
  }

  // Cap at 4 platforms (one per connected account) to conserve Apify credits
  const capped = platforms.slice(0, 4)

  try {
    const results = await Promise.allSettled(
      capped.map(async ({ platform, handle }) => {
        const [metrics, posts] = await Promise.all([
          getSocialMetrics(venture, platform, handle, refresh),
          includePosts ? getSocialPosts(venture, platform, 10) : Promise.resolve([]),
        ])
        return { platform, handle, metrics, posts }
      }),
    )

    const data = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value
      return { platform: capped[i].platform, handle: capped[i].handle, error: (r.reason as Error).message }
    })

    return NextResponse.json({ results: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[social-stats POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
