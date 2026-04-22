# CLAUDE.md — app/api/scrape/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Scrapes a user-supplied competitor URL using Apify Web Scraper and returns the extracted text content (trimmed to 8,000 characters).

## Request body

```ts
{ url: string }  // must include protocol — e.g. "https://competitor.com"
```

## Response shape

```ts
{ text: string }  // raw scraped text, max 8,000 chars
```

## Key notes

- Validates URL format with `new URL(url)` before calling Apify — returns `400` if invalid.
- Apify actor: `apify~web-scraper`.
- `maxDuration: 30s` in `vercel.json` — Apify polls with a 25s timeout inside `lib/apify.ts`.
- The caller (`website-agent/page.tsx`) passes this text to `/api/claude` as a user message for competitor analysis.
- Output is capped at 8,000 chars in `lib/apify.runWebScraper()` to stay within Claude's reasonable prompt size.
