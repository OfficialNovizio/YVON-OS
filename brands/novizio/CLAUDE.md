---
brand: novizio
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
- Never load the full vault. Scope to brands/novizio/ only.
- Update INDEX.md at session end.

## HIGH

### Novizio Brand Rules (from brands/novizio.md)
- Tone: Confident, elevated, minimal — never loud or salesy
- Voice: Short sentences. No exclamation marks in body copy.
- Headlines: 3–6 words max
- CTAs: "Shop now" / "Explore" / "View collection"

## RULES
- All changes go to dev branch — NEVER main
- Run `scripts/snapshot.sh novizio` before every Claude session
- Never deploy without Vercel preview check
- Never publish to main without Stark review
