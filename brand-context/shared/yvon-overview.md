# yvon-overview.md — YVON Parent Company
> Load when: context about the parent company structure is needed, or when working across ventures.

---

## What YVON Is
YVON is a parent company owned and operated solely by Stark. It manages multiple distinct ventures under one operational roof — sharing a team of AI agents, a BI dashboard, and operational infrastructure while keeping each brand's identity and audience completely separate.

## Current Ventures
| Venture | Type | Status |
|---------|------|--------|
| Novizio | Custom fashion brand | Active |
| Hourbour | Financial app (SaaS) | Active |

> New ventures are added via the `/ventures` page. Each gets its own brand profile in `brand-context/brands/`.

## Operating Principle
YVON exists to let Stark run multiple brands with the leverage of a full team — without the cost of one. Every agent serves all ventures. Every system is shared. Every brand competes in its own market with its own identity.

## Cross-Venture Rules
- **Brand voices never bleed** — Novizio is editorial fashion; Hourbour is approachable fintech. Never mix tones.
- **Social accounts are separate** — each venture has its own IG, YT, LinkedIn, GA4 property
- **Financials are separate** — Felix tracks P&L per venture + a consolidated YVON view
- **Analytics are separate** — Kai reports per venture, flags cross-venture patterns to Marcus
- **Agents serve both** — but always confirm active venture before producing any output

## Active Venture Context
Read from cookie `yvon_active_venture` or ask Stark at session start if unclear.
Never produce brand output without confirming which venture it's for.
