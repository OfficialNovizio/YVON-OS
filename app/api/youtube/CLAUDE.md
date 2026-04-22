# CLAUDE.md — app/api/youtube/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Fetches YouTube channel statistics and the 5 most recent video titles + view counts using the YouTube Data API v3.

## Request body

```ts
{ channelId: string }  // e.g. "UCxxxxxxxxxxxxxx"
```

## Response shape (`YouTubeStats`)

```ts
{
  subscribers:   number
  totalViews:    number
  videoCount:    number
  latestVideos:  VideoSummary[]  // max 5 items
  lastFetched:   string
}
```

## API calls made (in order)

1. `channels.list?part=statistics&id={channelId}` — subscriber/view/video counts
2. `search.list?part=snippet&channelId={channelId}&order=date&maxResults=5&type=video` — latest video IDs + titles
3. `videos.list?part=statistics,snippet&id={videoIds}` — view counts per video

## Key notes

- Free quota: 10,000 units/day. Each `search.list` call costs 100 units. Don't call unnecessarily.
- Delegates to `lib/youtube.getChannelStats()` — keep business logic there.
- `YOUTUBE_API_KEY` is a simple API key (not OAuth) — sufficient for public channel data.
