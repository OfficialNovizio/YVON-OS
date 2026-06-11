# YVON Dashboard — Product Identity
> LONG-TERM. What YVON is as a product — for when agents create content about YVON itself.
> Visual system → DESIGN.md · Architecture locks → CONTEXT.md

---

## What YVON Is

An AI operating system for solo founders. YVON orchestrates 13 agents across 4 departments — replacing the fragmented stack of SaaS tools, freelancers, and mental overhead that slow a solo operator down.

**Mission:** Give one person the leverage of a full team — without the cost, coordination overhead, or communication debt of hiring.

**What makes it different:** Most AI tools are chat. YVON has roles, memory, workflows, and accountability. Agents know what they own, remember what they've done, and improve from every session.

---

## The User — Stark (Primary)

| Field | Value |
|-------|-------|
| Who | Solo founder building AI-native businesses |
| How they work | Direct, fast, high context. Hates re-explaining things. |
| What they value | Speed over ceremony. Agency over delegation. Output over process. |
| What frustrates them | Agents that ask questions they should already know the answer to. Outputs that require editing. Generic advice that ignores the venture context. |
| What they trust | Specific, sourced, actionable. Confident verdicts with named reasoning. |

---

## What YVON Is NOT

| Not | Why this matters |
|-----|-----------------|
| A chatbot | YVON has persistent roles, memory, and system protocols. Not a single-query assistant. |
| An autonomous agent | Agents propose — Stark approves. Autonomous work stays in `requests/pending/`. |
| A SaaS product (yet) | Internal tool first. No public-facing brand requirements until launch. |
| A replacement for judgment | YVON amplifies Stark's decisions; it does not make them. |
| Feature-complete | Active infrastructure project. Gaps exist. Name them honestly. |

---

## Tone (when writing about or for YVON)

| Element | Rule |
|---------|------|
| Register | Precise, capable, direct — the tone of a system manual, not a pitch deck |
| Vocabulary | Technical when warranted. Plain when it can be. Never dumbed down. |
| Confidence | State what YVON does. Don't hedge what it is. |
| Never | Hype, buzzwords, "revolutionary", "game-changing", "AI-powered" without specifics |
| Address | "You" (to Stark). Never "our users" or "founders like you". |

**Use:** orchestrate · route · delegate · enforce · synthesize · distill · persist · ship
**Never:** revolutionary · cutting-edge · seamless · leverage (as buzzword) · empower · unlock

---

## YVON as Infrastructure

When agents discuss YVON — in internal docs, briefs, or agent-to-agent handoffs — treat it as infrastructure, not a product. The framing is:

- "YVON routes this to Raj" — not "YVON magically handles your backend"
- "Marcus synthesises the War Room" — not "Marcus uses AI to generate insights"
- "Quinn gates the merge" — not "Quinn checks that things are okay"

Agency and precision over magic and abstraction.

---

## Per-Agent Notes

| Agent | Context when working on YVON content |
|-------|--------------------------------------|
| **Mia** | YVON UI is glass morphism (G1-G4 system). Read DESIGN.md before any component. No hardcoded colors. |
| **Dev** | Architecture decisions go in CONTEXT.md. Security violations are immediate stops. |
| **Raj** | SUPABASE_SERVICE_ROLE_KEY server-side only. RLS required on every multi-venture table. |
| **Quinn** | Build gate runs before any YVON feature merge. `npx tsc --noEmit` zero errors required. |
| **Marcus** | YVON content is internal-first. No public-facing copy standards apply yet. |
| **Lena** | If writing copy ABOUT YVON (internal docs, agent descriptions), apply the tone above. No venture-brand voice. |
| **Kai** | YVON system metrics are token costs, API response times, agent call volume. Not social metrics. |
| **Felix** | YVON costs: Anthropic token usage, Apify calls, Supabase DB usage, Vercel bandwidth. Log weekly. |
| **Diana** | Operational rhythm for YVON = agent improvement sprints, not campaign cycles. |
| **Kahneman** | YVON strategic decisions: auth provider, rate limiting, alert channels. These qualify for bias review. |
