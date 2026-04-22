# CLAUDE.md — app/api/instagram/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Triggers an Apify Instagram Profile Scraper run and returns follower, following, and post counts for a given handle.

## Request body

```ts
{ handle: string }  // without @ — e.g. "novizio_brand"
```

## Response shape (`InstagramStats`)

```ts
{
  followers:   number
  following:   number
  posts:       number
  lastFetched: string  // ISO timestamp
}
```

## Key notes

- Strips `@` from the handle before passing to Apify.
- Delegates to `lib/apify.runInstagramScraper()` which polls until `SUCCEEDED`.
- Apify actor: `apify~instagram-profile-scraper`.
- Timeout: `maxDuration: 30s` set in `vercel.json` — do not exceed 25s in the Apify wait loop.
