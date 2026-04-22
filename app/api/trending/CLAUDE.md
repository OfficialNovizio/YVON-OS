# CLAUDE.md — app/api/trending/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Scrapes niche keyword URLs daily (via Vercel Cron at 9am), passes content to Claude, and returns a ranked list of trending content ideas.

## Trigger

- **Vercel Cron**: `0 9 * * *` (9am UTC daily) — configured in `vercel.json`
- **Manual**: `GET /api/trending` from the Trending page "Refresh Now" button

## Auth

Vercel Cron passes `Authorization: Bearer {CRON_SECRET}`. The route validates this header. Set `CRON_SECRET` in Vercel environment variables. Manual calls from the browser also need this — the client sends no auth header, so `CRON_SECRET` must be left unset in `.env.local` for local dev manual refreshes to work.

## Response shape

```ts
{
  trends: TrendItem[]   // up to 8 items
  generatedAt: string   // ISO timestamp
}
```

## Niche keywords

Scrape target URLs are hardcoded at the top of `route.ts`. Update them to match your content niche:

```ts
const NICHE_URLS = [
  'https://trends.google.com/trends/explore?q=small+business+marketing',
  'https://www.reddit.com/r/smallbusiness/top/?t=day',
]
```

## Claude model

Uses `claude-haiku-4-5-20251001` — fast and cheap for daily summarization. Only change to a heavier model if output quality is insufficient.

## Data persistence

This route returns JSON. The client (`trending/page.tsx`) writes the `TrendItem[]` array to `localStorage` via `lib/storage.setTrendingPipeline()`. There is no server-side database.
