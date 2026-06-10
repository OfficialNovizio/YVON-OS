# Code Dependency Graph — YVON (2026-06-09)
> 355 files · 575 import edges
> Rebuild: `npm run codegraph:build`

---

## Hub Files — Most Imported (highest blast radius)

| # | File | Importers |
|---|------|-----------|
| 1 | `lib/types.ts` | **72** |
| 2 | `lib/supabase.ts` | **65** |
| 3 | `lib/ai-client.ts` | **53** |
| 4 | `lib/db.ts` | **43** |
| 5 | `lib/secrets.ts` | **31** |
| 6 | `lib/agents.ts` | **18** |
| 7 | `app/components/Shimmer.tsx` | **14** |
| 8 | `lib/use-venture-slug.ts` | **14** |
| 9 | `lib/db-phase1.ts` | **13** |
| 10 | `lib/venture-context.ts` | **11** |
| 11 | `app/components/Nav/NavBar.tsx` | **10** |
| 12 | `lib/apify.ts` | **10** |
| 13 | `app/screens/settings/_shared.tsx` | **9** |
| 14 | `app/screens/competitor/_subnav.tsx` | **7** |
| 15 | `app/api/team-chat/mode-resolver.ts` | **6** |

> Changing a hub file affects every importer. Always check rdeps before editing.

---

## High Fan-Out Files — Most Imports (coupling risk)

| File | Imports |
|------|---------|
| `app/api/team-chat/route.ts` | 19 |
| `app/screens/career/page.tsx` | 16 |
| `app/api/content-intelligence/route.ts` | 8 |
| `app/api/team-chat/build-gate-stage.ts` | 7 |
| `app/api/team-chat/validate-stage.ts` | 7 |
| `app/api/team-chat/brief-builder.ts` | 6 |
| `app/api/team-chat/execute-stage.ts` | 6 |
| `app/api/trending/route.ts` | 6 |
| `app/screens/ceo-command-dashboard/_briefing.tsx` | 6 |
| `app/api/calendar-verify/route.ts` | 5 |
| `app/api/content/route.ts` | 5 |
| `app/api/health/route.ts` | 5 |

> High fan-out = high coupling. If this file changes, many things break.

---

## API Route Dependency Map

**`app/api/team-chat/route.ts`** (19 deps)
  → `lib/agents.ts`
  → `lib/ai-client.ts`
  → `lib/github.ts`
  → `lib/venture-documents.ts`
  → `lib/secrets.ts`
  → `lib/collaboration-manager.ts`
  → `lib/monitoring.ts`
  → `lib/db.ts`
  → `lib/types.ts`
  → `app/api/team-chat/mode-resolver.ts`
  → `app/api/team-chat/brief-builder.ts`
  → `app/api/team-chat/plan-stage.ts`
  → `app/api/team-chat/execute-stage.ts`
  → `app/api/team-chat/validate-stage.ts`
  → `app/api/team-chat/synthesize-stage.ts`
  → `lib/session.ts`
  → `lib/session-flag.ts`
  → `app/api/team-chat/build-gate-stage.ts`
  → `lib/build-gate.ts`

**`app/api/content-intelligence/route.ts`** (8 deps)
  → `lib/secrets.ts`
  → `lib/ai-client.ts`
  → `lib/reports.ts`
  → `lib/intelligence.ts`
  → `lib/kahneman-prompt.ts`
  → `lib/big-idea.ts`
  → `lib/content-series.ts`
  → `lib/supabase.ts`

**`app/api/trending/route.ts`** (6 deps)
  → `lib/ai-client.ts`
  → `lib/secrets.ts`
  → `lib/apify.ts`
  → `lib/db.ts`
  → `lib/sanitize.ts`
  → `lib/types.ts`

**`app/api/calendar-verify/route.ts`** (5 deps)
  → `lib/db.ts`
  → `lib/secrets.ts`
  → `lib/apify.ts`
  → `lib/similarity.ts`
  → `lib/types.ts`

**`app/api/content/route.ts`** (5 deps)
  → `lib/ai-client.ts`
  → `lib/db.ts`
  → `lib/activity.ts`
  → `lib/agents.ts`
  → `lib/types.ts`

**`app/api/health/route.ts`** (5 deps)
  → `lib/health/database.ts`
  → `lib/health/website.ts`
  → `lib/health/spend.ts`
  → `lib/health/repository.ts`
  → `lib/health/alerts.ts`

**`app/api/agent-cron/pulse/route.ts`** (4 deps)
  → `lib/secrets.ts`
  → `lib/ai-client.ts`
  → `lib/db.ts`
  → `lib/types.ts`

**`app/api/big-idea/route.ts`** (4 deps)
  → `lib/big-idea.ts`
  → `lib/ai-client.ts`
  → `lib/supabase.ts`
  → `lib/types.ts`

**`app/api/briefing/route.ts`** (4 deps)
  → `lib/ai-client.ts`
  → `lib/secrets.ts`
  → `lib/db.ts`
  → `lib/agents.ts`

**`app/api/content-flywheel/route.ts`** (4 deps)
  → `lib/ai-client.ts`
  → `lib/db-phase1.ts`
  → `lib/supabase.ts`
  → `lib/types.ts`

**`app/api/creative-studio/route.ts`** (4 deps)
  → `lib/ai-client.ts`
  → `lib/clothing.ts`
  → `lib/supabase.ts`
  → `lib/types.ts`

**`app/api/growth-sprint/route.ts`** (4 deps)
  → `lib/ai-client.ts`
  → `lib/agents.ts`
  → `lib/agent-memory.ts`
  → `lib/types.ts`

**`app/api/reports/generate/route.ts`** (4 deps)
  → `lib/secrets.ts`
  → `lib/ai-client.ts`
  → `lib/supabase.ts`
  → `lib/reports.ts`

**`app/api/sip/run/route.ts`** (4 deps)
  → `lib/sip-manager.ts`
  → `lib/agents.ts`
  → `lib/types.ts`
  → `lib/ai-client.ts`

**`app/api/agent-cron/calibration/route.ts`** (3 deps)
  → `lib/secrets.ts`
  → `lib/ai-client.ts`
  → `lib/db.ts`


---

## Potentially Orphaned Files

> Not imported by any other file — verify before deleting.

- `app/screens/analytics/loading.tsx`
- `app/screens/analytics/market/loading.tsx`
- `app/screens/analytics/portfolio/loading.tsx`
- `app/screens/analytics/reports/loading.tsx`
- `app/screens/analytics/social-media/loading.tsx`
- `app/screens/career/loading.tsx`
- `app/screens/ceo-command-dashboard/loading.tsx`
- `app/screens/competitor/_quadrant-chart.tsx`
- `app/screens/competitor/loading.tsx`
- `app/screens/creative-studio/loading.tsx`
- `app/screens/health/loading.tsx`
- `app/screens/merchandize/loading.tsx`
- `app/screens/settings/loading.tsx`
- `app/screens/settings/secrets/loading.tsx`
- `app/screens/war-room/loading.tsx`
- `lib/agent-skills.ts`
- `lib/claude-client.ts`
- `lib/content-multiplier.ts`
- `lib/elevenlabs.ts`
- `lib/error-tracker.ts`
- `lib/experiment-engine.ts`
- `lib/growth-loops.ts`
- `lib/memory-manager.ts`
- `lib/posthog.ts`
- `lib/routing-feedback.ts`
- `lib/session-schema.ts`
- `lib/storage.ts`
- `lib/utils.ts`
- `lib/venture-server.ts`

---

_Generated by `scripts/codegraph-build.mjs` on 2026-06-09_