# PAGES.md — YVON Routes & Pages Reference
> Load this file only when: adding a new page, debugging routing issues, or mapping the full app structure.
> **Updated 2026-04-12:** Phase 1-4 complete. Brand Pulse, Market Radar, Campaign Studio live. 24 new API routes added.

## Active Pages

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Command Center — KPI overview + YVON Health Score + latest CEO brief snippet | Venture-scoped |
| `/brand-pulse` | Brand Pulse — social metrics, revenue attribution, anomaly alerts, content scoring | Venture-scoped, 3 tabs |
| `/market-radar` | Market Radar — competitor scorecard, Territory Scout, bubble chart | Venture-scoped |
| `/campaign-studio` | Campaign Studio — full 6-stage builder: brief → ideas → scripts → captions → prompts → assets | AI-driven pipeline |
| `/social` | Social Analytics — IG, YouTube, LinkedIn metrics | Venture-scoped |
| `/trending` | Trending in Niche — daily content pipeline | Vercel Cron at 9am |
| `/team` | Team Directory — 13 agent cards + quick-chat | 3-layer structure |
| `/war-room` | War Room — CEO-facilitated group chat, smart routing | Max 2 specialists |
| `/inbox` | CEO Inbox — Daily CEO Morning Briefings + Pulse report Mondays | Unread badge in NavBar |
| `/settings` | Settings — agent configs, ventures, notifications | Supabase is source of truth |
| `/agents/[agentId]` | Individual agent chat — dynamic route for all 13 agents | Last 5 sessions visible |
| `/analytics` | Analytics dashboard | Venture-scoped |
| `/ventures` | Ventures management + Add Brand section | Brand onboarding flow |
| `/tasks` | Task management — Ship Protocol (Scoped / In Flight / Shipped) | Single source for all tasks + deliverables |
| `/creative` | Creative Studio — Brief → Direction → Production → Ops | Atlas · Pixel + Lena · Rio |

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/claude` | Streams Claude responses (SSE) — prompt caching enabled |
| `/api/route-intent` | Haiku intent classifier (War Room step 1) |
| `/api/team-chat` | War Room orchestrator (fan-out + CEO synthesis) — hard cap: 2 specialists |
| `/api/briefing` | CEO brief generator (Cron + on-demand) |
| `/api/email` | Resend email sender |
| `/api/venture` | Active venture config loader |
| `/api/ventures` | All ventures list |
| `/api/settings` | Read/write agent settings to Supabase |
| `/api/instagram` | Apify — writes to Supabase, venture-scoped |
| `/api/linkedin` | Apify — writes to Supabase, venture-scoped |
| `/api/youtube` | YouTube API — writes to Supabase, venture-scoped |
| `/api/analytics` | Google Analytics — writes to Supabase, venture-scoped |
| `/api/scrape` | Apify web scraper (on-demand) |
| `/api/trending` | Vercel Cron — writes trending_items per venture |
| `/api/tasks` | Task management — Ship Protocol states |
| `/api/competitor-content` | Cached competitor content |
| `/api/stripe-webhook` | Stripe webhook receiver — payment + refund events with UTM attribution |
| `/api/posthog-ingest` | PostHog session ingestion — session tracking + UTM matching |
| `/api/content-score` | Composite content scoring — per-platform weights, top/worst content |
| `/api/anomaly-check` | Anomaly detection — reach drop, engagement spike, revenue anomaly, audience dip |

| `/api/territory-scout` | Territory Scout — topic cluster analysis, unclaimed territory detection |
| `/api/market-radar` | Market Radar — competitor scoring, scorecard data |
| `/api/campaign-builder` | Campaign Builder — multi-stage pipeline (ideas→scripts→captions→voiceover→prompts) |
| `/api/krea-generate` | Krea AI visual generation — campaign assets |
| `/api/content-flywheel` | Content Flywheel — Identify→Mutate→Deploy→Learn from top posts |
| `/api/competitor-exploit` | Competitor Exploit — first-mover content briefs from unclaimed territory |
| `/api/revenue-attribution` | Revenue Attribution — post-to-purchase path visualization |
| `/api/audience-intelligence` | Audience Intelligence — Quinn listens, extracts desires, generates briefs |
| `/api/community-scan` | Community Scanner — Reddit, TikTok comments, Discord signals |
| `/api/creator-engine` | Creator & Influence — rising micro-creator discovery + outreach briefs |
| `/api/brand-dna` | Brand DNA — learn voice profile from winning content |
| `/api/narrative-arc` | Narrative Arc Planner — 4-week connected content sequences |
| `/api/channel-conviction` | Channel Conviction — identifies highest-leverage single platform |
| `/api/crisis-warning` | Crisis Early Warning — sentiment spikes, brand mention monitoring |
| `/api/collaboration-detector` | Collaboration Detector — adjacent-niche brand collab opportunities |
| `/api/conversion-copy` | Conversion Copy — top-performing content by format |
| `/api/social-commerce` | Social Commerce — purchase-intent post detection |
| `/api/archive-intelligence` | Archive Intelligence — resurrect old content aligned with trends |

## Pages

| Route | Purpose | Notes |
|-------|---------|-------|
| `/brand-pulse` | Brand Pulse — composite scores, top/worst 10, anomaly alerts | Phase 2 |

## Kill Log — 2026-04-01
> Pages removed. Features absorbed into surviving pages where applicable.

| Route | Reason | Absorbed Into |
|-------|--------|---------------|
| `/sops` | SOPs for a one-person company is bureaucracy theater | Retired |
| `/activity` | Activity feed with no defined action = noise | Retired |
| `/deliverables` | Duplicate of /tasks. One source of truth. | `/tasks` (Ship Protocol) |
| `/content` | Duplicate of /creative. One creative pipeline. | `/creative` |
| `/scout` | Scout agent retired. Idea validation is a distraction. | Retired |
| `/personal` | Stark Growth agent retired. Focus leak. | Retired |

## Legacy Redirects (next.config.ts — no page folders)

| Old Route | Redirects To |
|-----------|-------------|
| `/marketing-agent` | `/agents/lena-brand` |
| `/coding-agent` | `/agents/dev-lead` |
| `/website-agent` | `/agents/kai-analyst` |
| `/agent-manager` | `/settings` |
| `/deliverables` | `/tasks` |
| `/content` | `/creative` |

## Rules for New Pages
- Always add to NavBar (`components/NavBar.tsx`)
- Always read active venture from cookie `yvon_active_venture`
- Never call `/api/team-chat` from individual agent pages (War Room only)
- **New rule:** Every page must have a defined weekly action before it's built. No page exists without a purpose.
