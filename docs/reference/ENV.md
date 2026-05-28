# ENV.md — Environment Variables Reference
> Load this file only when: setting up a new deployment, debugging 401 errors, or adding a new external service.
> Never commit these values to GitHub. Set in Vercel: Project → Settings → Environment Variables.

## Required Env vars set

| Variable | Used By | Notes |
|----------|---------|-------|
| `ANTHROPIC_API_KEY` | All Claude agents | All `/api/claude`, `/api/route-intent`, `/api/team-chat`, `/api/briefing` |
| `SUPABASE_URL` | Server-side Supabase client | `lib/supabase.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase client | **NEVER expose to browser** |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser Supabase client | `lib/supabase-client.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | Safe for client — read-only public access |

## External Integrations (existing)

| Variable | Used By |
|----------|---------|
| `APIFY_TOKEN` | Legacy fallback only — Apify credentials now live in Supabase Vault (see below) |
| `YOUTUBE_API_KEY` | `/api/youtube` |
| `GOOGLE_SA_JSON` | `/api/analytics` — full service account JSON object |
| `RESEND_API_KEY` | `/api/email` — CEO brief digest emails |
| `BRIEFING_EMAIL` | Recipient email for daily CEO briefs |
| `CRON_SECRET` | Bearer token for Vercel Cron validation |

## Phase 1 — New API Keys

| Variable | Used By | Notes |
|----------|---------|-------|
| `STRIPE_SECRET_KEY` | `/api/stripe-webhook` — revenue data via webhook | Server-side only |
| `STRIPE_WEBHOOK_SECRET` | `/api/stripe-webhook` — signature verification | From Stripe CLI or dashboard |
| `POSTHOG_API_KEY` | `/api/posthog-ingest` — session tracking | Project API key |
| `POSTHOG_HOST` | `/api/posthog-ingest` — self-hosted PostHog | Default: us.i.posthog.com |

## Venture-Specific (add one set per brand)

### Novizio
| Variable | Value |
|----------|-------|
| `NOVIZIO_IG_HANDLE` | Instagram handle — no `@` prefix |
| `NOVIZIO_YT_CHANNEL_ID` | YouTube channel ID |
| `NOVIZIO_LI_PROFILE_URL` | LinkedIn page URL |
| `NOVIZIO_GA4_PROPERTY_ID` | GA4 property ID |

### Hourbour
| Variable | Value |
|----------|-------|
| `HOURBOUR_IG_HANDLE` | Instagram handle — no `@` prefix |
| `HOURBOUR_YT_CHANNEL_ID` | YouTube channel ID |
| `HOURBOUR_LI_PROFILE_URL` | LinkedIn page URL |
| `HOURBOUR_GA4_PROPERTY_ID` | GA4 property ID |

### Adding a New Brand
Copy the Novizio block above, replace prefix with new brand's slug (e.g., `BRANDNAME_IG_HANDLE`).
Then update `brand-context/brands/{brandname}.md` with the matching config.

## Apify — Supabase Vault Storage

Apify credentials are stored encrypted in Supabase Vault (migration 036), not in env files.

| Vault key | Description |
|-----------|-------------|
| `apify_api_key` | Apify API token — read via `get_app_secret('apify_api_key')` |
| `apify_user_id` | Apify user ID |

**Free plan budget rules (enforced in `lib/apify.ts`):**
- Cache TTL: 24 hours — Apify is never called if valid cache exists
- Max posts per run: 10
- Only refresh on explicit user click — never on page load
- Use sync actor endpoint (`run-sync-get-dataset-items`) — no polling overhead

**To update credentials:** Run `node scripts/seed-apify.mjs <NEW_KEY> <USER_ID>` (creates the script fresh, runs it, then delete the script — the key is never stored in any file).

## Troubleshooting
| Problem | Check |
|---------|-------|
| 401 from any API | Env vars saved in Vercel + project redeployed |
| Apify returns no data | IG handle must NOT include `@` |
| Claude agent silent | Billing at console.anthropic.com |
| Google Analytics empty | Service account email added as Viewer on GA4 property |
