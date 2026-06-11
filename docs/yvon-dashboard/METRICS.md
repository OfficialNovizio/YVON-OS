# YVON Dashboard — Metrics
> Rolling. Updated by Kai/Felix weekly as baselines and actuals are established.
> These are system-level metrics for the YVON platform itself, not for Novizio or Hourbour.

---

## KPI Targets

| Metric | Target | Alert Threshold | Owner | Cadence |
|--------|--------|----------------|-------|---------|
| Anthropic token cost | < $X/week (TBD) | Spike > 50% WoW | Felix | Weekly Monday |
| Apify scraper calls | < $X/month (TBD) | Spike > 30% MoM | Felix | Monthly |
| Supabase DB size | < $X/month (TBD) | At 80% of plan | Dev | Monthly |
| Vercel bandwidth | Within free/pro tier | Usage > 80% | Dev | Monthly |
| API route error rate | < 2% | Any spike > 5% | Quinn + Raj | Per session |
| Build gate pass rate | 100% | Any failure | Quinn | Per session |
| Agent session writes | All sessions logged | Missing write | Quinn | Per session |

---

## Current Baselines

| Metric | Last Value | Date | Source | Notes |
|--------|-----------|------|--------|-------|
| Weekly token cost | [not yet recorded] | — | Anthropic dashboard | Felix to pull Monday |
| Apify monthly cost | [not yet recorded] | — | Apify dashboard | Felix to pull monthly |
| Avg API response time | [not yet recorded] | — | Vercel logs | Dev to benchmark |
| War Room calls / week | [not yet recorded] | — | /api/team-chat logs | Kai to count |
| SKILLS.md load coverage | 14/14 agents | 2026-05-28 | Audit | All load triggers wired |

---

## System Health Dashboard

Quinn runs a weekly YVON Health Pulse every Friday — spot-checking one random output per agent layer. Scoring: 🟢 Green (meets bar) / 🟡 Yellow (minor gaps) / 🔴 Red (structural failure).

| Layer | Score | Last Checked | Note |
|-------|-------|-------------|------|
| CEO (Marcus, Diana) | — | Not yet run | |
| Technical (Dev, Raj, Mia, Quinn) | — | Not yet run | |
| Marketing (Kai, Lena, Rio, Nate, Atlas, Pixel) | — | Not yet run | |
| Finance (Felix) | — | Not yet run | |
| Psychology (Kahneman) | — | Not yet run | |

---

## Reporting Cadence

| Report | Owner | Frequency | Delivered to |
|--------|-------|-----------|-------------|
| Token cost summary | Felix | Monday weekly | Marcus CEO brief |
| Build gate pass rate | Quinn | Per session | Dev |
| YVON Health Pulse | Quinn | Friday weekly | Marcus (CEO brief Monday) |
| Infrastructure cost review | Dev + Felix | Monthly | Marcus → Stark |
| Session memory writes audit | Diana | Monthly | Marcus |

---

## How to Update This File

Felix or Kai updates baselines during Monday's CEO brief preparation. Any agent can file a new KPI target if a gap is identified during their work. New targets require Marcus approval before being added.
