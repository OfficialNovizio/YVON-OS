# Venture Registry
> Marcus reads this to understand what ventures exist and what to load for each.
> One source of truth for venture status and default load manifest.

---

## Active Ventures

| Venture | Slug | Type | Status | Default venture |
|---------|------|------|--------|----------------|
| [Novizio](novizio/) | `novizio` | Fashion DTC e-commerce | Active | — |
| [Hourbour](hourbour/) | `hourbour` | Fintech SaaS | Active | — |
| [YVON Dashboard](yvon-dashboard/) | `yvon-os` | Internal BI platform | Active | ✅ fallback |

**Default venture** — if cookie `yvon_active_venture` is missing and SESSION.md has no clear active venture, load `yvon-dashboard`. Never guess between Novizio and Hourbour.

---

## Load Manifest — what Marcus loads per venture

| File | Novizio | Hourbour | yvon-dashboard | When |
|------|---------|---------|----------------|------|
| `SESSION.md` | ✅ | ✅ | ✅ | Always — first read |
| `CONTEXT.md` | ✅ | ✅ | ✅ | Always |
| `FEEDBACK.md` | ✅ 🔴 always · 🟡 if relevant | ✅ | ✅ | Always (🔴 minimum) |
| `BRAND.md` | If: copy, marketing, content, brand decision | ✅ same | ✅ same | On demand |
| `DESIGN.md` | If: any UI, visual, component, asset work | ✅ same | ✅ same | On demand |

---

## File Roles — one job per file

| File | Job | NOT for |
|------|-----|---------|
| `SESSION.md` | What happened, what's next, what's blocked | Why decisions were made |
| `CONTEXT.md` | Why + when decisions were locked (strategic) | Rolling state or rules |
| `FEEDBACK.md` | Rules from errors/corrections — 🔴🟡🟢 tagged, dated | Strategic decisions |
| `BRAND.md` | Who this venture is to the world | Visual execution |
| `DESIGN.md` | How this venture looks in code and assets | Brand positioning |

**The CONTEXT vs FEEDBACK razor:**
- CONTEXT.md → *decision + WHY it was made + date locked*
- FEEDBACK.md → *rule derived from an error or correction — no WHY needed, just the rule*

---

## Venture Switch Protocol (Marcus)

```
Stark: "switch to [venture]"
    ↓
1. Save current venture state → ventures/[current]/SESSION.md
2. Output VENTURE SWITCH marker in conversation (hard boundary)
3. Load new venture: SESSION.md + CONTEXT.md + FEEDBACK.md
4. Load BRAND.md / DESIGN.md only if task requires it
5. Re-read each agent's Quick Context row for the new venture
6. ENGAGE: "Switching to [venture]. Last active [date]. [In Flight task]. Continue or new task?"
```

**For deep UI or brand work: recommend new session.** Structural isolation beats instructed isolation.

---

## Cross-Venture Rules

Rules that apply across all ventures live in:
- `docs/memory/feedback.md` — agent behaviour, routing, self-improvement rules
- `docs/memory/design.md` — shared UI/design patterns across all ventures

Never put a cross-venture rule inside a venture file.
