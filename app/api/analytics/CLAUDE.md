# CLAUDE.md — app/api/analytics/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Queries the Google Analytics Data API (GA4) for the last 30 days and returns session counts, pageviews, bounce rate, and top 10 pages.

## Method

`GET` — no request body needed. All config comes from env vars.

## Response shape (`AnalyticsReport`)

```ts
{
  sessions:    number
  pageviews:   number
  bounceRate:  number   // 0–1 float
  topPages:    { path: string; views: number }[]
  period:      '30d'
  lastFetched: string
}
```

## Auth

Uses a **service account** (not OAuth). `GOOGLE_SA_JSON` holds the full JSON key file contents as a string. The service account email must be added as a **Viewer** on the GA4 property in Google Analytics → Admin → Property access management.

## Key notes

- Delegates to `lib/google-analytics.getAnalyticsReport()` which uses `@google-analytics/data` `BetaAnalyticsDataClient`.
- `GA4_PROPERTY_ID` is the numeric property ID (found in GA4 → Admin → Property Settings).
- If this route returns empty data, check the service account email is added as a Viewer on the correct GA4 property.
