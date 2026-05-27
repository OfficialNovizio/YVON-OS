# Graph Report — YVON (2026-05-27)
> **973 nodes · 1634 edges · 21 named communities** (92 singleton/config clusters excluded)
> Rebuild: `npm run graphify:build` | Query: `npm run graphify:query -- "question"`

---

## God Nodes (highest impact — most connections)

| Rank | Node | Edges | Note |
|------|------|-------|------|
| 1 | `select()` | 101 | — |
| 2 | `db.ts` | 90 | — |
| 3 | `.update()` | 33 | — |
| 4 | `_content.tsx` | 26 | — |
| 5 | `page.tsx` | 23 | — |
| 6 | `MonitoringService` | 21 | — |
| 7 | `.parse()` | 20 | — |
| 8 | `.warn()` | 18 | — |

> `POST()` / `GET()` have 90–100 edges but are generic handler names — actual call sites may be fewer.

---

## Named Communities

| # | Community | Nodes | Key Functions |
|---|-----------|-------|---------------|
| 0 | **Activity & Stream Layer** | 148 | route.ts, GET(), route.ts, route.ts |
| 1 | **AI Creative Generation** | 104 | route.ts, POST(), route.ts, route.ts |
| 2 | **Database Operations** | 103 | getVentureHandles(), verifyVenture(), agentSystem(), getSpecialistBriefing() |
| 3 | **Monitoring & Error Tracking** | 57 | error-tracker.ts, ErrorTracker, .constructor(), .initTrackingDir() |
| 4 | **Activity & Stream Layer** | 42 | route.ts, scoreVirality(), clamp(), defScore() |
| 5 | **Delete Operations** | 38 | AuditIcon(), savePillar(), _growth-sprint.tsx, startSprint() |
| 6 | **Client Storage / UI State** | 37 | middleware.ts, getRateLimitConfig(), verifyToken(), middleware() |
| 8 | **Delete Operations** | 34 | getTierForFollowers(), getTierMatchedCompetitors(), fmt(), HealthDot() |
| 9 | **Delete Operations** | 33 | prefetchVentureGithubSnapshot(), test(), agent-tools.ts, safeResolve() |
| 10 | **Memory & Session Ops** | 32 | claude-client.ts, streamMessage(), session-manager.ts, validateSession() |
| 11 | **Delete Operations** | 27 | _content.tsx, getSunday(), addDays(), sameDay() |
| 12 | **Agent Dispatch** | 18 | route.ts, loadVentureContextBlock(), formatGithubSnapshot(), classifyIntent() |
| 13 | **Social Media Scrapers** | 16 | route.ts, scrapeForPlatform(), findBestMatch(), apify.ts |
| 14 | **Skills System** | 15 | skills-manager.ts, SkillsManager, .constructor(), .getSkillsPath() |
| 15 | **Agent Routing Engine** | 13 | collaboration-manager.ts, calculateRoutingConfidence(), recommendCollaboration(), HandoffManager |
| 16 | **Agent Dispatch** | 9 | gatekeeper.ts, classifyIntent(), validateContext(), gatekeep() |
| 18 | **Delete Operations** | 8 | _idea-bank.tsx, showSavedToast(), fetchTrending(), fetchAngles() |
| 19 | **Delete Operations** | 7 | content-series.ts, rowToSeries(), getContentSeries(), createContentSeries() |
| 20 | **Memory Optimization** | 7 | memory-manager.ts, enforceSectionCaps(), compressOldEntries(), archiveOldEntries() |
| 22 | **Delete Operations** | 6 | _resume-vault.tsx, load(), handleUpload(), analyzeResume() |
| 25 | **Session Migration** | 5 | session-schema.ts, validateSessionContent(), parseSessionContent(), migrateSessionContent() |

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