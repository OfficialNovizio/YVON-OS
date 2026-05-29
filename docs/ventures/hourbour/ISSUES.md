# Hourbour — Issues Log
> Rolling. Updated by agents whenever an issue is found or resolved.
> Open issues block relevant product, campaign, or financial work. Read before starting any Hourbour task.
> Priority: 🔴 Critical (blocks work) | 🟡 High (degrades quality) | 🟢 Low (nice to fix)

---

## Open Issues

| ID | Priority | Category | Description | Owner | Opened |
|----|----------|----------|-------------|-------|--------|
| HRB-001 | 🔴 | Product | Trial-to-paid conversion flow not designed — no activation sequence exists | Nate + Dev → Stark | 2026-05-01 |
| HRB-002 | 🟡 | Financial | Pricing model not decided — monthly vs annual, freemium tier? | Felix + Marcus → Stark | 2026-05-01 |
| HRB-003 | 🟡 | Financial | LTV:CAC baseline unknown — cannot validate if acquisition is healthy | Felix → Kai | 2026-05-01 |
| HRB-004 | 🟡 | Analytics | App sessions/user baseline not recorded — churn detection impossible without it | Kai → Stark | 2026-05-15 |
| HRB-005 | 🟡 | Analytics | MRR baseline not set — Felix cannot produce P&L without it | Felix → Stark | 2026-05-01 |
| HRB-006 | 🟡 | Growth | Primary acquisition channel not decided — LinkedIn Ads vs SEO vs PLG referral | Marcus + Nate → Stark | 2026-05-01 |
| HRB-007 | 🟡 | Brand | ICP fields in BRAND.md are `[fill in]` — Financial state and tool usage not set | Marcus → Stark | 2026-05-01 |
| HRB-008 | 🟢 | Ads | ROAS target for LinkedIn not set — requires 90-day data from Kai first | Rio → Kai | 2026-05-28 |

---

## Recently Resolved (last 30 days)

| ID | Description | Resolved by | Date | Notes |
|----|-------------|-------------|------|-------|
| HRB-R01 | Rio and Atlas had deprecated brand refs in skills — used stale hourbour.md paths | Marcus | 2026-05-28 | Fixed — now injected from docs/ventures/hourbour/BRAND.md |
| HRB-R02 | Cohort retention SQL template missing — no tool for trial-to-paid funnel analysis | Kai | 2026-05-28 | cohort-analysis SKILL.md created with M1 retention threshold |
| HRB-R03 | SaaS e-commerce metrics were conflated — Felix had no Hourbour-specific model | Felix | 2026-05-28 | ecommerce-metrics SKILL.md created; SaaS vs DTC distinction explicit |

---

## How to File an Issue

Any agent that discovers a gap or blocker during Hourbour work files it here during ADJOURNING.

**Format:**
```
| HRB-XXX | [🔴/🟡/🟢] | [Category] | [One sentence description] | [Owner: Agent → Stark if decision needed] | [YYYY-MM-DD] |
```

**Categories:** Product · Financial · Analytics · Growth · Brand · Ads · Tech · Content · Legal

**Moving to Resolved:** When an issue is fixed, move it to "Recently Resolved." Drop entries older than 30 days from Resolved.
