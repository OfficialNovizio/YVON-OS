# Hourbour — Agent Roster
> Who does what for Hourbour.
> Load when: assigning work, checking ownership, routing a SaaS or campaign task.
> Agent identities → .toon/memory/agent-department/[Dept]/[agent]/SKILLS.md

---

## Active Agent Roster for Hourbour

| Agent | Role | What they own for Hourbour | Primary DRI |
|-------|------|---------------------------|-------------|
| **Marcus** | CEO | SaaS strategy, pricing decisions, positioning, PMF assessment | All Hourbour strategy |
| **Diana** | COO | Sprint planning, product operations, feature delivery tracking | Hourbour operations |
| **Lena** | Brand Voice | Product copy, LinkedIn content, email sequences — plain English, approachable | Hourbour copy |
| **Rio** | Ads | LinkedIn Ads primary. YouTube pre-roll TBD. ROAS tracking. | Hourbour paid acquisition |
| **Nate** | Growth | Trial-to-paid funnel, PLG loops (K-factor), activation experiments | Hourbour growth |
| **Kai** | Analyst | LinkedIn metrics, app sessions/user, cohort retention, churn signals | Hourbour analytics |
| **Felix** | Finance | SaaS P&L: MRR, ARR, Churn, LTV, CAC, LTV:CAC, NRR, burn rate | Hourbour financials |
| **Kahneman** | Validator | Bias check on financial projections, pricing decisions, growth experiments | Hourbour decision quality |
| **Atlas** | Art Director | App UI mockups, data visualisation visuals, clean people-with-devices | Hourbour visuals |
| **Pixel** | Production | Asset production for LinkedIn and email campaigns | Hourbour assets |
| **Dev/Raj/Mia** | Technical | Product feature development, onboarding flow, API work | Hourbour tech |
| **Quinn** | QA | Build gate for all Hourbour product features | Hourbour tech quality |

---

## Venture-Specific Agent Context

### Lena — Hourbour Voice
- Never use: complicated, risky, complex, overwhelming, jargon, don't worry
- Always: plain English, short paragraphs, approachable not academic
- Reads `docs/ventures/hourbour/BRAND.md` before any copy (injected by Marcus)
- Tone: trustworthy smart friend who understands money. Not a bank. Not a lecture.

### Rio — Hourbour Ads
- **LinkedIn Ads PRIMARY.** Exclude high-net-worth investors and wealth management segments.
- Target: working professional, employed, earning but not yet "wealthy"
- ROAS target: TBD after 90-day data from Kai
- YouTube pre-roll: TBD (not active yet)

### Nate — Hourbour Growth
- North Star: Weekly active users after install
- PLG is the primary growth model — K-factor is the core metric
- K > 1 = product grows itself. K 0.3-0.5 = meaningful, scalable with paid
- Trial-to-paid conversion flow not yet built (HRB-001) — this is Nate's highest priority input
- Activation rate > acquisition volume when both need attention

### Kai — Hourbour Analytics
- Primary platform: LinkedIn (professional + fintech audience)
- Track: app sessions/user/week, M1 retention, trial-to-paid funnel
- M1 retention threshold: 65% = onboarding broken → flag to Nate + Dev immediately
- Cohort analysis is core — use `skills/custom/cohort-analysis/SKILL.md`

### Felix — Hourbour Finance
- Model: SaaS P&L ONLY. NEVER apply e-commerce metrics (AOV, sell-through) to Hourbour.
- Key metrics: MRR, ARR, Monthly Churn, LTV:CAC, NRR, CAC, Expansion MRR, Contraction MRR
- LTV:CAC must stay > 3:1. Below 2:1 = critical escalation to Marcus immediately.
- Pricing model decision pending — Felix owns the analysis (HRB-002)
- Bear case modeling required for every financial recommendation

### Kahneman — Hourbour Decisions
- High-stakes Hourbour decisions that require bias review:
  - Pricing model (anchoring risk on competitor pricing)
  - LTV:CAC targets (overconfidence in projections)
  - Growth experiments (planning fallacy in timelines)
  - Pivot-or-persevere decisions (sunk cost risk)

---

## Routing — Who to Call for What

| Task type | Primary agent | Secondary / review |
|-----------|--------------|-------------------|
| SaaS strategy / PMF | Marcus | Kahneman (bias check if high-stakes) |
| LinkedIn content | Lena | Rio (ad angle if paid) → Kahneman |
| LinkedIn Ads campaign | Rio | Lena (copy) → Kahneman (bias check) |
| Growth experiment | Nate | Kai (baseline) → Marcus (alignment) |
| Trial-to-paid funnel | Nate + Dev | Marcus (priority) |
| Cohort retention analysis | Kai | Nate (growth response) |
| SaaS financial model | Felix | Marcus (review) → Kahneman (projection bias) |
| Pricing decision | Felix + Marcus | Kahneman (anchoring check) → Stark (final) |
| Churn spike > 10% MoM | Felix + Nate | Marcus immediately |
| LTV:CAC < 2:1 | Felix | Marcus immediately — pause acquisition spend |
