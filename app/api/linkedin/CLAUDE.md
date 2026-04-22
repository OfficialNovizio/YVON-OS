# CLAUDE.md — app/api/linkedin/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Triggers an Apify LinkedIn Scraper run and returns follower and connection counts for a profile URL.

## Request body

```ts
{ profileUrl: string }  // e.g. "https://linkedin.com/in/yourname"
```

## Response shape (`LinkedInStats`)

```ts
{
  followers:   number
  connections: number
  lastFetched: string  // ISO timestamp
}
```

## Key notes

- Apify actor: `apimaestro~linkedin-profile-scraper`.
- Timeout: `maxDuration: 30s` in `vercel.json`.
- LinkedIn rate-limits scraping — if runs start failing, increase polling delay in `lib/apify.ts`.
