# CLAUDE.md — app/api/

> Parent rules: see `/YVON/app/CLAUDE.md` → `/YVON/CLAUDE.md` → `/Projects/CLAUDE.md`.

## What this folder is

All Next.js Route Handlers live here. These run **server-side only** — they are the only place API keys are permitted. The browser never calls external services directly; it always goes through these routes.

## Routes

| Folder | Method | External service | Auth env var |
|--------|--------|-----------------|-------------|
| `claude/` | POST | Anthropic API — streams SSE | `ANTHROPIC_API_KEY` |
| `instagram/` | POST | Apify Instagram Profile Scraper | `APIFY_TOKEN` |
| `linkedin/` | POST | Apify LinkedIn Scraper | `APIFY_TOKEN` |
| `youtube/` | POST | YouTube Data API v3 | `YOUTUBE_API_KEY` |
| `analytics/` | GET | Google Analytics Data API | `GOOGLE_SA_JSON`, `GA4_PROPERTY_ID` |
| `scrape/` | POST | Apify Web Scraper | `APIFY_TOKEN` |
| `trending/` | GET | Apify + Anthropic (cron) | `APIFY_TOKEN`, `ANTHROPIC_API_KEY`, `CRON_SECRET` |

## Shared conventions for every route

1. **Check env vars first** — return `500` immediately if required keys are missing.
2. **Validate inputs** — return `400` for missing/malformed request body before calling any external service.
3. **Error shape** — always return `{ error: string }` JSON on failure, never throw unhandled.
4. **No `any` types** — type the request body with an inline interface or import from `@/lib/types`.
5. **Lib layer** — business logic (API calls, polling, data mapping) lives in `@/lib/`, not inline in `route.ts`.
