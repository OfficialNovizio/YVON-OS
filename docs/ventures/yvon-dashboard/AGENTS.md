# YVON Dashboard — Agent Roster
> Who does what for the YVON platform itself.
> Load when: assigning work to agents, checking ownership, routing a task across departments.
> Agent identities → .toon/memory/agent-department/[Dept]/[agent]/SKILLS.md

---

## Agent Roster

All 13 YVON agents + Kahneman are active on the YVON Dashboard venture. Technical and Executive departments own the platform directly; others contribute on-demand.

| Agent | Role | What they own for YVON | Primary DRI |
|-------|------|----------------------|-------------|
| **Marcus** | CEO | Strategic direction, agent improvement sprints, War Room synthesis | All YVON strategy |
| **Diana** | COO | Sprint planning, milestone tracking, operational cadence for YVON builds | YVON operations |
| **Dev** | Lead Developer | Architecture, API contracts, final code review, merge approvals | All YVON code |
| **Raj** | Backend Developer | All `/app/api/*.ts` route handlers, Supabase schema, external integrations | YVON backend |
| **Mia** | Frontend Developer | All React components, pages, design system maintenance (`globals.css`) | YVON frontend |
| **Quinn** | QA Engineer | Build gates, lint passes, weekly Pulse check, APPROVED/BLOCKED verdicts | YVON quality |
| **Kai** | Analyst | YVON system metrics (token costs, API errors, agent call volume) | YVON metrics |
| **Felix** | Finance | YVON infrastructure costs (Anthropic, Apify, Supabase, Vercel) | YVON costs |
| **Kahneman** | Behavioral Validator | Bias review of YVON strategic decisions (auth, rate limiting, roadmap priorities) | YVON decision quality |
| **Diana** | COO | Content pipeline coordination for any YVON agent training material | YVON ops |
| **Lena** | Brand/Content | If writing copy ABOUT YVON (internal docs, descriptions) — uses YVON tone, not venture brand | YVON copy |
| **Nate** | Growth | Product-led growth loops for YVON itself (if/when it becomes a product) | YVON PLG |
| **Rio** | Ads | Not primary — no paid acquisition for YVON yet | — |
| **Atlas** | Art Director | YVON visual design if/when it goes public-facing | — |
| **Pixel** | Production | YVON asset production if/when it goes public-facing | — |

---

## Venture-Specific Agent Context

### Dev — YVON Platform
- Owns all architectural decisions for the YVON codebase
- Final merge approval after Quinn's APPROVED verdict
- Key rule: never merge without Quinn — no exceptions on YVON code
- Current focus: WebSearch wiring into `/api/claude` (YVN-001)

### Raj — YVON Backend
- All 60+ `/app/api/` route handlers
- Supabase schema management and RLS enforcement
- External integrations: Apify (competitor scraper), YouTube API, GA4, Anthropic, Resend
- Current focus: RLS gaps on multi-venture tables (YVN-002)

### Mia — YVON Frontend
- Glass morphism design system (G1-G4 — see DESIGN.md)
- `globals.css` is the single source of truth for all design tokens
- Never hardcode colors — CSS variables only
- Current focus: Inbox approval UI for agent proposals (YVN-005)

### Quinn — YVON Quality
- `npx tsc --noEmit` + `npm run lint` — both must pass before any APPROVED verdict
- Weekly YVON Health Pulse — Friday, one output per agent layer
- Pulse results → Marcus CEO brief (Monday)

### Kai — YVON Analytics
- YVON system metrics are NOT social metrics — they are token costs, API errors, agent call volumes
- Reads from: Anthropic usage dashboard, Apify billing, Vercel analytics, Supabase metrics
- Feeds Felix's Monday cost report

### Felix — YVON Finance
- Infrastructure cost tracking: Anthropic tokens, Apify calls, Supabase, Vercel bandwidth
- Flags runway impact if tool costs exceed plan by > 20%
- Weekly Monday cost check included in Marcus CEO brief

---

## Routing — Who to Call for What

| Task type | Primary agent | Secondary / review |
|-----------|--------------|-------------------|
| New API route or schema | Raj | Dev (review) → Quinn (QA) |
| UI component or page | Mia | Dev (review) → Quinn (QA) |
| Architecture or tech decision | Dev | Diana (feasibility) |
| Sprint planning or milestone | Diana | Marcus (approval) |
| YVON strategic direction | Marcus | Kahneman (bias check if high-stakes) |
| Infrastructure cost concern | Felix | Dev (technical) → Marcus (decision) |
| Agent SKILLS.md improvement | Marcus + agent-creator | Quinn (review) |
| QA gate before merge | Quinn | Dev (escalation if blocked > 1hr) |
| System metric anomaly | Kai | Felix (cost) or Dev (technical) |
