---
brand: hourbour
type: fintech-saas
---

## CRITICAL

### Karpathy Rules (from coding/01-karpathy.md)
- Think before coding. State assumptions. Ask if unclear.
- Minimum code only. If 50 lines works, never write 200.
- Touch only what you must. Mention unrelated issues, never fix them silently.
- Define success criteria before starting any task.

### Memory Rules (from agents/01-memory.md)
- Load INDEX.md first — always.
- Load known-issues.md before touching any code.
- Never load the full vault. Scope to brands/hourbour/ only.
- Update INDEX.md at session end.

## HIGH

### Hourbour Brand Rules (from brands/hourbour.md)
- Type: Financial App (Fintech) — NOT a fashion brand. Never treat it as one.
- Business model: SaaS — subscription revenue. Primary metric: MRR, ARR, Churn.
- Tone: Trustworthy, Clear, Approachable — smart friend who understands money.
- Voice: Plain English always. No financial jargon. Short clear sentences.
- CTAs: "Start for free" / "Try it free" / "Get started" / "See how it works"
- Felix applies SaaS P&L: MRR, ARR, Churn Rate, LTV, CAC, LTV:CAC, NRR.

## RULES
- All changes go to dev branch — NEVER main
- Run `scripts/snapshot.sh hourbour` before every Claude session
- Never deploy without Vercel preview check
- Hourbour is FINTECH — LTV:CAC must stay above 3:1
- Never reference Novizio in Hourbour copy — completely separate identity
- Never deploy to main without Stark review
