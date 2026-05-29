# YVON Dashboard — Issues Log
> Rolling. Updated by agents whenever an issue is found or resolved.
> Open issues block relevant work. Read before starting any feature on the YVON platform.
> Priority: 🔴 Critical (blocks work) | 🟡 High (degrades quality) | 🟢 Low (nice to fix)

---

## Open Issues

| ID | Priority | Category | Description | Owner | Opened |
|----|----------|----------|-------------|-------|--------|
| YVN-001 | 🔴 | API | WebSearch not wired into `/api/claude` — agents cannot search the web mid-conversation | Dev + Raj | 2026-05-10 |
| YVN-002 | 🔴 | Security | Supabase RLS not applied to multi-venture tables — cross-venture data leak risk | Raj | 2026-05-15 |
| YVN-003 | 🟡 | Auth | Auth provider not decided — Supabase Auth built-in vs custom OAuth pending Stark approval | Marcus → Stark | 2026-05-01 |
| YVN-004 | 🟡 | Infrastructure | Upstash Redis not set up — rate limiting not enforced on any API route | Dev → Stark | 2026-05-15 |
| YVN-005 | 🟡 | UI | Inbox approval UI for agent proposals not built — `requests/pending/` not surfaced in UI | Mia | 2026-05-15 |
| YVN-006 | 🟡 | Alerts | Alert notification channel not decided — Resend email vs dashboard panel pending | Marcus → Stark | 2026-05-01 |
| YVN-007 | 🟢 | Competitor | Competitor pipeline Apify token not tested end-to-end with live credentials | Raj | 2026-05-28 |
| YVN-008 | 🟢 | YVON OS | Novizio BRAND.md ICP fields ([fill in]) not yet populated — blocks precise targeting | Marcus → Stark | 2026-05-20 |

---

## Recently Resolved (last 30 days)

| ID | Description | Resolved by | Date | Notes |
|----|-------------|-------------|------|-------|
| YVN-R01 | All 14 agent SKILLS.md load triggers missing or incomplete | Marcus + skill-creator | 2026-05-28 | 14 SKILL.md files created; all triggers wired |
| YVN-R02 | Shared session-protocol and error-tracking skills missing | Marcus + skill-creator | 2026-05-28 | Both created in shared/skills/ |
| YVN-R03 | Triple-pass protocol was a Load Trigger (bypassable), not a blocking gate | Marcus | 2026-05-28 | MANDATORY OS GATES added to all 14 SKILLS.md |
| YVN-R04 | Deprecated brand refs in 5 agent SKILLS.md files | Marcus | 2026-05-28 | All 5 fixed — now injected by Marcus from BRAND.md |

---

## How to File an Issue

Any agent that discovers a bug, gap, or architectural problem files it here during ADJOURNING.

**Format:**
```
| YVN-XXX | [🔴/🟡/🟢] | [Category] | [One sentence description] | [Owner: Agent → Stark if decision needed] | [YYYY-MM-DD] |
```

**Categories:** API · Security · Auth · UI · Infrastructure · Alerts · Competitor · YVON OS · Performance · Data

**Moving to Resolved:** When an issue is fixed, move it to "Recently Resolved" with a notes column saying what changed. Drop entries older than 30 days from Resolved.
