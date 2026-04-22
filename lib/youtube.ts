import 'server-only'
import type { YouTubeStats, VideoSummary } from '@/lib/types'

const YT_BASE = 'https://www.googleapis.com/youtube/v3'
const KEY = process.env.YOUTUBE_API_KEY!

interface YTChannelResponse {
  items?: Array<{
    statistics?: {
      subscriberCount?: string
      viewCount?: string
      videoCount?: string
    }
  }>
}

interface YTSearchResponse {
  items?: Array<{
    id?: { videoId?: string }
    snippet?: {
      title?: string
      publishedAt?: string
    }
  }>
}

interface YTVideoResponse {
  items?: Array<{
    id?: string
    statistics?: { viewCount?: string }
  }>
}

export async function getChannelStats(channelId: string): Promise<YouTubeStats> {
  // 1. Channel statistics
  const chRes = await fetch(
    `${YT_BASE}/channels?part=statistics&id=${channelId}&key=${KEY}`
  )
  if (!chRes.ok) throw new Error(`YouTube channels API: ${chRes.status}`)
  const chData = await chRes.json() as YTChannelResponse
  const stats = chData.items?.[0]?.statistics ?? {}

  // 2. Latest 5 video IDs
  const searchRes = await fetch(
    `${YT_BASE}/search?part=snippet&channelId=${channelId}&order=date&maxResults=5&type=video&key=${KEY}`
  )
  if (!searchRes.ok) throw new Error(`YouTube search API: ${searchRes.status}`)
  const searchData = await searchRes.json() as YTSearchResponse
  const searchItems = searchData.items ?? []

  const videoIds = searchItems
    .map((i) => i.id?.videoId)
    .filter(Boolean)
    .join(',')

  let latestVideos: VideoSummary[] = []

  if (videoIds) {
    // 3. Video view counts
    const vidRes = await fetch(
      `${YT_BASE}/videos?part=statistics,snippet&id=${videoIds}&key=${KEY}`
    )
    if (vidRes.ok) {
      const vidData = await vidRes.json() as YTVideoResponse
      latestVideos = (vidData.items ?? []).map((item, idx) => ({
        id: item.id ?? videoIds.split(',')[idx] ?? '',
        title: searchItems[idx]?.snippet?.title ?? '',
        views: parseInt(item.statistics?.viewCount ?? '0', 10),
        publishedAt: searchItems[idx]?.snippet?.publishedAt ?? '',
      }))
    }
  }

  return {
    subscribers: parseInt(stats.subscriberCount ?? '0', 10),
    totalViews:  parseInt(stats.viewCount ?? '0', 10),
    videoCount:  parseInt(stats.videoCount ?? '0', 10),
    latestVideos,
    lastFetched: new Date().toISOString(),
  }
}
