# STACK.md — YVON Technical Reference
> Load this file only when: making architecture decisions, debugging build errors, onboarding to the codebase, or planning new API routes.

## Framework & Language
- **Next.js 15** (App Router) — frontend + API routes in one project
- **TypeScript** (strict mode)
- **Tailwind CSS** + CSS variables for the design system

## Services
| Service | Purpose | Access |
|---------|---------|--------|
| Anthropic Claude API | All AI agents | Server-side only via `/api/claude` |
| Supabase (Postgres) | All persistent data | Server: service role key; Client: anon key |
| Apify | Instagram, LinkedIn, web scraper | Server-side only |
| YouTube Data API v3 | YouTube metrics | Server-side only |
| Google Analytics Data API | GA4 reports | Server-side only (service account JSON) |
| Resend | CEO brief email digest | Server-side only |
| Vercel | Hosting + Cron jobs | Auto-deploys on GitHub push |

## Architecture Rule (non-negotiable)
```
BROWSER (React / Next.js pages)
        ↓
NEXT.JS API ROUTES  (/app/api/* — API keys live here only)
        ↓
EXTERNAL SERVICES (Anthropic | Apify | YouTube | GA4 | Supabase)
```
API keys must never touch client components. All external calls go through `/api/` route handlers.

## AI Streaming
- Claude responses stream via `ReadableStream` / server-sent events (SSE)
- Prompt caching enabled on system prompts for token efficiency
- War Room: Haiku for classification + specialist briefings; Sonnet for CEO synthesis

## Design System
- Colors: navy `#1A1A2E`, red `#E94560`, blue `#0F3460`
- Font: Inter (UI), Courier New (code blocks)
- Style: dark cyberpunk professional, max 8px border radius
- CSS variables in `globals.css` → consumed via `tailwind.config.ts` (both must stay in sync)

## Build Commands
```bash
npm install          # Install dependencies
npm run dev          # Local dev (localhost:3000)
npm run build        # Production build (Vercel/Windows only)
npm run lint         # ESLint — must pass before merge
npx tsc --noEmit     # TypeScript check — use in Linux VM (SWC is Windows-only)
```

## State & Persistence
| Layer | What Lives Here |
|-------|----------------|
| Supabase | social_stats, analytics_reports, trending_items, conversations, messages, briefs, agent_memory, agents config |
| Cookie `yvon_active_venture` | Active venture slug — server-accessible, persists across nav |
| localStorage | Ephemeral UI only: active tab, scroll position, UI prefs — NEVER data |
