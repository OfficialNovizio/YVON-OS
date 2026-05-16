# SPEC: Visible Agent Session History
> Owner: Dev + Mia | Assigned by: System Restructure (Phase 5) | Priority: Medium
> Priya: convert to formal PRD if sprint-planned.

---

## What & Why
Each agent's chat page (`/agents/[agentId]`) currently shows only the live conversation.
Stark needs to see what each agent worked on in the last 5 sessions without digging through MEMORY.md files.
Data already exists in Supabase `agent_memory` table — this is a pure UI addition.

---

## Behaviour

### Where
A collapsible "Session History" panel on each `/agents/[agentId]` page.
- Collapsed by default — one click to expand
- Sits above the chat input, below the agent header
- Renders last 5 session log entries for that agent

### What It Shows (per entry)
```
[2026-03-24]  Dev  |  Added /content API route  |  ✅ Passed lint + tsc
[2026-03-23]  Dev  |  SIP cleanup — bulk agent update  |  Completed
```
Fields: date | agent name | task description | outcome

### Data Source
Read from Supabase `agent_memory` table:
```sql
SELECT key, value, updated_at
FROM agent_memory
WHERE agent_id = '{agentId}'
  AND key = 'recent_tasks'
ORDER BY updated_at DESC
LIMIT 1
```
`recent_tasks` is a JSON array stored by agents via `/api/settings`. Each entry:
```json
{ "date": "2026-03-24", "task": "Added /content route", "outcome": "Passed lint + tsc" }
```

---

## Component Spec

### New Component: `AgentSessionHistory.tsx`
```tsx
// Props
interface AgentSessionHistoryProps {
  agentId: string
  // fetches its own data via /api/settings
}

// Layout
<details> // collapsed by default
  <summary>Session History (last 5)</summary>
  <table>
    <tr> Date | Task | Outcome </tr>
    {sessions.map(s => <tr>...)}
  </table>
</details>
```

### Integration Point
In `/app/agents/[agentId]/page.tsx`:
- Import `AgentSessionHistory`
- Render between agent header and chat window
- Pass `agentId` from route params

---

## API Requirement
`/api/settings` already handles `GET ?type=memory&agentId=X` — no new route needed.
The component calls this endpoint and parses the `recent_tasks` key.

---

## Design Notes (Leo / Mia)
- Use `var(--color-navy)` background, `var(--color-red)` accent for dates
- Collapsed state: shows "Last session: [date] — [task]" summary in one line
- Expanded: full 5-row table, subtle dividers
- Empty state: "No session history yet" in muted text
- Max 5 rows — never paginate, never show more

---

## Acceptance Criteria (Quinn)
- [ ] Panel renders on all 21 agent pages (including 4 new agents)
- [ ] Shows last 5 sessions from `agent_memory.recent_tasks`
- [ ] Collapsed by default; expands on click
- [ ] Empty state handled gracefully
- [ ] Uses CSS variable tokens only — no hardcoded colors
- [ ] `npm run lint` + `npx tsc --noEmit` pass with zero errors
