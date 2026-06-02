# Graph Report — YVON (2026-06-02)
> **1057 nodes · 1804 edges · 21 named communities** (98 singleton/config clusters excluded)
> Rebuild: `npm run graphify:build` | Query: `npm run graphify:query -- "question"`

---

## God Nodes (highest impact — most connections)

| Rank | Node | Edges | Note |
|------|------|-------|------|
| 1 | `select()` | 108 | — |
| 2 | `db.ts` | 92 | — |
| 3 | `.update()` | 36 | — |
| 4 | `_content.tsx` | 26 | — |
| 5 | `page.tsx` | 23 | — |
| 6 | `apify.ts` | 21 | — |
| 7 | `MonitoringService` | 21 | — |
| 8 | `.parse()` | 20 | — |

> `POST()` / `GET()` have 90–100 edges but are generic handler names — actual call sites may be fewer.

---

## Named Communities

| # | Community | Nodes | Key Functions |
|---|-----------|-------|---------------|
| 0 | **Database Operations** | 140 | route.ts, getVentureHandles(), findBestMatch(), verifyVenture() |
| 1 | **API Threshold Layer** | 125 | route.ts, GET(), route.ts, route.ts |
| 2 | **Activity & Stream Layer** | 120 | route.ts, POST(), route.ts, route.ts |
| 3 | **Monitoring & Error Tracking** | 72 | error-tracker.ts, ErrorTracker, .constructor(), .initTrackingDir() |
| 4 | **Activity & Stream Layer** | 41 | route.ts, scoreVirality(), clamp(), defScore() |
| 6 | **Delete Operations** | 38 | prefetchVentureGithubSnapshot(), classifyTask(), test(), agent-tools.ts |
| 7 | **Memory & Session Ops** | 32 | claude-client.ts, streamMessage(), session-manager.ts, validateSession() |
| 8 | **Client Storage / UI State** | 32 | middleware.ts, getRateLimitConfig(), verifyToken(), middleware() |
| 9 | **Delete Operations** | 30 | VentureSwitcher.tsx, onVentureChange(), handleClick(), selectVenture() |
| 10 | **Delete Operations** | 27 | _content.tsx, getSunday(), addDays(), sameDay() |
| 11 | **Delete Operations** | 25 | _followups.tsx, Avatar(), daysRelative(), markDone() |
| 13 | **Social Media Scrapers** | 23 | scrapeForPlatform(), apify.ts, getToken(), isApifyConfigured() |
| 14 | **Agent Dispatch** | 20 | route.ts, loadVentureContextBlock(), loadOsContext(), formatGithubSnapshot() |
| 15 | **Competitor Intelligence** | 16 | competitor-pipeline.ts, fmtFollowers(), resolveHandles(), scrapeCompetitor() |
| 16 | **Agent Routing Engine** | 13 | collaboration-manager.ts, calculateRoutingConfidence(), recommendCollaboration(), HandoffManager |
| 18 | **Agent Dispatch** | 9 | gatekeeper.ts, classifyIntent(), validateContext(), gatekeep() |
| 20 | **Delete Operations** | 8 | _idea-bank.tsx, showSavedToast(), fetchTrending(), fetchAngles() |
| 21 | **Delete Operations** | 7 | content-series.ts, rowToSeries(), getContentSeries(), createContentSeries() |
| 22 | **Memory Optimization** | 7 | memory-manager.ts, enforceSectionCaps(), compressOldEntries(), archiveOldEntries() |
| 24 | **Delete Operations** | 6 | _resume-vault.tsx, load(), handleUpload(), analyzeResume() |
| 26 | **Session Migration** | 5 | session-schema.ts, validateSessionContent(), parseSessionContent(), migrateSessionContent() |

---

## Architecture Flow

```
User request
  → /api/* route handler  [API Threshold Layer]
  → verifyVenture()       [God Node]
  → Gatekeeper            → Agent Dispatch → Agent Routing Engine
  → Database Operations   → Supabase Client Layer
  → Monitoring & Error Tracking  (all paths report here)
```

**AI Creative pipeline:**
`AI Creative Generation` ← `Social Media Scrapers` → `Revenue & Analytics Events` → `Brand DNA`

**Memory pipeline:**
`Memory & Session Ops` → `Memory Optimization` → `Client Storage / UI State`

---

## Codegraph (Import Dependency Map)

See `graphify-out/CODEGRAPH_REPORT.md` for file-level import analysis.
Rebuild: `npm run codegraph:build`