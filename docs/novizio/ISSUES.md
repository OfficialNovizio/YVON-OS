# Novizio — Issues Log
> Rolling. Updated by agents whenever an issue is found or resolved.
> Open issues block relevant campaign, content, or tech work. Read before starting any Novizio task.
> Priority: 🔴 Critical (blocks work) | 🟡 High (degrades quality) | 🟢 Low (nice to fix)

---

## Open Issues

| ID | Priority | Category | Description | Owner | Opened |
|----|----------|----------|-------------|-------|--------|
| NOV-001 | 🟡 | Brand | ICP fields in BRAND.md are `[fill in]` — Age, Gender, Location not set | Marcus → Stark | 2026-05-01 |
| NOV-002 | 🟡 | Campaign | SS26 launch date not confirmed — "targeting late June" but not locked | Marcus → Stark | 2026-05-20 |
| NOV-003 | 🟡 | Analytics | IG Reels vs static ratio decision pending — Kai reviewing performance data | Kai → Marcus | 2026-05-20 |
| NOV-004 | 🟡 | Production | Wholesale vs DTC split for SS26 not decided — affects production run sizing | Marcus → Stark | 2026-05-20 |
| NOV-005 | 🟡 | Financial | AOV baseline not established — Felix cannot model SS26 P&L without it | Felix → Stark | 2026-05-20 |
| NOV-006 | 🟢 | Analytics | ROAS target not set by Rio — requires historical data from Kai first | Rio → Kai | 2026-05-28 |
| NOV-007 | 🟢 | Content | Content calendar not started for SS26 — no copy or asset schedule | Diana → Lena | 2026-05-20 |

---

## Recently Resolved (last 30 days)

| ID | Description | Resolved by | Date | Notes |
|----|-------------|-------------|------|-------|
| NOV-R01 | Competitor data pipeline not built | Raj + Dev | 2026-05-28 | Apify pipeline built; token test pending |
| NOV-R02 | Lena had deprecated brand refs in skills — used stale novizio.md paths | Marcus | 2026-05-28 | Fixed — now injected from docs/ventures/novizio/BRAND.md |

---

## How to File an Issue

Any agent that discovers a gap or blocker during Novizio work files it here during ADJOURNING.

**Format:**
```
| NOV-XXX | [🔴/🟡/🟢] | [Category] | [One sentence description] | [Owner: Agent → Stark if decision needed] | [YYYY-MM-DD] |
```

**Categories:** Brand · Campaign · Analytics · Production · Financial · Content · Tech · SEO · Ads

**Moving to Resolved:** When an issue is fixed, move it to "Recently Resolved." Drop entries older than 30 days from Resolved.
