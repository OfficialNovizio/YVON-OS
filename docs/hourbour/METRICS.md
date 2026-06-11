# Hourbour — Metrics
> Rolling. Updated by Kai and Felix weekly as baselines are established.
> These are Hourbour-specific KPIs. Platform-level metrics → yvon-dashboard/METRICS.md

---

## KPI Targets

| Metric | Target | Alert Threshold | Owner | Cadence |
|--------|--------|----------------|-------|---------|
| MRR | [fill in — not yet tracked] | Drop > 10% MoM — flag immediately | Felix | Monthly |
| Monthly churn | < [fill in]% | Any spike above threshold — escalate to Marcus | Felix | Monthly |
| LTV:CAC | > 3:1 | Below 2:1 — critical, escalate to Marcus immediately | Felix | Quarterly |
| NRR (Net Revenue Retention) | > 100% | Below 90% — contraction dominant | Felix | Monthly |
| Trial-to-paid conversion | > [fill in]% | < 10% at M1 — onboarding broken | Nate → Kai | Weekly |
| M1 retention | ≥ 65% | < 65% — Nate + Dev investigate onboarding | Kai | Monthly |
| App sessions/user/week | [fill in] | Drop > 20% WoW — churn signal | Kai | Weekly |
| LinkedIn ER | > 2% | Drop > 25% WoW | Kai | Weekly |
| CAC (LinkedIn Ads) | [TBD by Rio] | LTV:CAC < 3:1 | Rio + Felix | Per campaign |

---

## Current Baselines

| Metric | Last Value | Date | Source | Notes |
|--------|-----------|------|--------|-------|
| MRR | [not yet recorded] | — | Supabase / Stripe | Felix to pull |
| Monthly churn | [not yet recorded] | — | — | No data yet |
| LTV:CAC | [unknown] | — | — | Pricing model pending (HRB-002) |
| Trial-to-paid rate | [unknown] | — | — | Funnel not built yet (HRB-001) |
| LinkedIn followers | [not yet recorded] | — | `/api/linkedin` | Kai to pull |
| App sessions/user | [not yet recorded] | — | Supabase | Kai to pull |

---

## SaaS Health Indicators

| Signal | What it means | Who owns the response |
|--------|--------------|----------------------|
| MRR drop > 10% MoM | Churn spike or pricing mismatch | Felix + Nate flag to Marcus |
| NRR < 100% | Expansion revenue not offsetting churn | Nate → growth experiment |
| M1 retention < 65% | Onboarding failure | Nate + Dev diagnose activation |
| LTV:CAC < 2:1 | Acquisition economics broken | Felix + Marcus — pause spend |
| K-factor > 0.5 | Meaningful virality — scale it | Nate → Marcus fast track |

---

## Reporting Cadence

| Report | Owner | Frequency | Delivered to |
|--------|-------|-----------|-------------|
| SaaS metrics snapshot | Felix | Monthly | Marcus CEO brief |
| LinkedIn performance | Kai | Weekly Monday | Marcus |
| Cohort retention report | Kai | Monthly | Marcus + Nate |
| Growth experiment results | Nate | Per experiment (14-day read) | Marcus |
| LTV:CAC calculation | Felix | Quarterly | Marcus → Stark |

---

## How to Update This File

Felix and Kai update baselines during the Monday CEO brief preparation. Any metric in "[fill in]" state is an open issue — log it in ISSUES.md as 🟡 High if it's blocking a decision.
