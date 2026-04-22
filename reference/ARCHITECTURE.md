# ARCHITECTURE.md — Component & Library Reference
> Load this file only when: navigating the codebase, planning a new component, or debugging file-level issues.

## /app — Pages & API Routes
```
layout.tsx              Shared nav + design system shell + VentureSwitcher
page.tsx                Command Center (/) — KPIs + latest CEO brief snippet
/social/page.tsx        Social analytics — venture-scoped
/trending/page.tsx      Trending pipeline — Vercel Cron at 9am
/team/page.tsx          Team Directory — all agents
/war-room/page.tsx      War Room — CEO-facilitated group chat
/inbox/page.tsx         CEO Morning Briefing inbox
/settings/page.tsx      Settings — agents, ventures, notifications
/agents/[agentId]/      Dynamic individual agent chat
/analytics/page.tsx     Analytics dashboard
/ventures/page.tsx      Ventures management + Add Brand
/activity/page.tsx      Activity feed
/content/page.tsx       Content management
/deliverables/page.tsx  Deliverables tracker
/sops/page.tsx          SOPs
/tasks/page.tsx         Task management
/personal/page.tsx      Personal Growth dashboard (LinkedIn, personal brand)
/scout/page.tsx         Startup Idea Validation dashboard
```

## /components — Shared UI Components
```
AgentAvatar.tsx         Visual identity card — 3 sizes
AgentSettingsCard.tsx   Agent config card for Settings
AgentSkillsPanel.tsx    Agent skills display
AgentSessionHistory.tsx Last 5 sessions per agent (reads Supabase agent_memory)
VentureSettingsCard.tsx Per-venture config for Settings
WarRoom.tsx             War Room chat UI
BriefCard.tsx           CEO brief display card
VentureSwitcher.tsx     Venture toggle in NavBar
RoutingChain.tsx        Shows specialists consulted + routing confidence
AgentChat.tsx           Reads/writes Supabase conversations
DataCard.tsx            Generic data display card
KpiTile.tsx             KPI metric tile
SocialPlatformCard.tsx  Social platform metrics card
ActivityFeed.tsx        Activity feed list
NavBar.tsx              Shared nav with VentureSwitcher + inbox badge
```

## /lib — Utilities & Helpers
```
supabase.ts             Server-side Supabase client (service role key)
supabase-client.ts      Browser Supabase client (anon key)
db.ts                   Typed DB helpers
agents.ts               All agent configs (defaults — Supabase is live source of truth)
agent-skills.ts         Agent skills registry
venture-context.ts      Active venture helpers (cookie-based)
claude-client.ts        SSE consumer
storage.ts              Ephemeral UI state only — no data keys
types.ts                AgentConfig, VentureContext, Brief, AgentId, etc.
apify.ts                Apify wrapper
youtube.ts              YouTube API wrapper
google-analytics.ts     GA4 API wrapper
activity.ts             Activity feed helpers
```

## Component Rules
- Always use CSS variable tokens — no hardcoded colors
- Server Components by default; add `'use client'` only when needed (hooks, interactivity)
- AgentChat reads/writes Supabase — never calls external APIs directly
- NavBar must be updated whenever a new page is added
- All new pages must read active venture from cookie `yvon_active_venture`
