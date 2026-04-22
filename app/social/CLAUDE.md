# CLAUDE.md — app/social/

> Parent rules: see `/YVON/app/CLAUDE.md`.

## What this page does

Displays Instagram, YouTube, and LinkedIn metrics in three `<SocialPlatformCard>` columns. Each card has a refresh button that calls the corresponding API route, updates the UI, and writes the result to `localStorage`.

## Data flow

```
User clicks Refresh
  → fetch('/api/instagram' | '/api/youtube' | '/api/linkedin')
  → response written to localStorage via lib/storage
  → state updated → UI re-renders
  → ActivityFeed entry appended
```

## Handles / channel IDs

Social handles are read from `NEXT_PUBLIC_*` env vars with fallbacks:

| Env var | Default | Used for |
|---------|---------|---------|
| `NEXT_PUBLIC_IG_HANDLE` | `'yourbrand'` | Instagram handle (no @) |
| `NEXT_PUBLIC_YT_CHANNEL_ID` | `''` | YouTube channel ID |
| `NEXT_PUBLIC_LI_PROFILE_URL` | `''` | LinkedIn profile URL |

Set these in `.env.local`. `NEXT_PUBLIC_` prefix makes them available on the client side — they are **not secrets**.

## Key notes

- On mount, stats are hydrated from `localStorage` so the page is never blank on reload.
- Each platform has independent `isLoading` state so refresh spinners are isolated.
- `SocialPlatformCard` is in `components/` — don't add platform-specific layout logic to this page.
