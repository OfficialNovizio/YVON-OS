# CLAUDE.md — app/trending/

> Parent rules: see `/YVON/app/CLAUDE.md`.

## What this page does

Displays a card grid of AI-generated trending content ideas. Cards can be marked as `new`, `used`, or `archived`. Archived items collapse into a `<details>` section.

## Data flow

```
On mount → reads localStorage via lib/storage.getTrendingPipeline()
"Refresh Now" button → fetch('/api/trending') → response.trends written to storage → UI updates
Status button click → updates TrendItem.status in state + storage
```

## TrendItem lifecycle

`new` → `used` → `archived`

Status changes are persisted immediately to `localStorage`. The Vercel Cron writes fresh items as all `status: 'new'` — they don't replace existing non-new items automatically (the client overwrites the entire pipeline array on each refresh).

## Niche keywords

The scraped URLs are hardcoded in `app/api/trending/route.ts`. Update them there, not here.

## Key notes

- Archived cards render at 50% opacity in a collapsed `<details>` block.
- The last-run timestamp is read from the first `TrendItem.generatedAt` in the pipeline.
- "Refresh Now" manually calls `/api/trending` — for this to work in local dev, `CRON_SECRET` must be unset in `.env.local`.
