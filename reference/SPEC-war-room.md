# SPEC: War Room Improvements
> Owner: Dev + Raj + Mia | Assigned by: System Restructure (Phase 6) | Priority: High
> Priya: convert to formal PRD when sprint-planned.

---

## Improvement 1 — @ Mention Override

### What
Let Stark force-include a specific agent in a War Room message by typing `@agentId`.
Example: `@felix what's our Hourbour runway if we grow 15% MoM?` → always routes Felix regardless of classifier.

### Why
The Haiku classifier sometimes misroutes. Stark knows his team — let him call who he needs.

### Implementation (Raj — `/api/team-chat/route.ts`)
Before running the intent classifier, parse the incoming message for `@mentions`:
```typescript
const mentionPattern = /@([\w-]+)/g
const forcedAgents = [...message.matchAll(mentionPattern)].map(m => m[1])
// forcedAgents = ['felix'] if message contains '@felix'
```
If `forcedAgents.length > 0`:
- Skip the `/api/route-intent` classifier call
- Use `forcedAgents.slice(0, 2)` directly as the specialist list (hard cap still enforced)
- Still run Marcus CEO synthesis on top

If `forcedAgents.length === 0`: normal classifier flow unchanged.

### UI (Mia — `components/WarRoom.tsx`)
- Highlight `@mention` tokens in the input as the user types (blue text)
- Show a small agent chip below the input when a valid agentId is mentioned
- Invalid agentId: show "Unknown agent @xyz" warning inline

---

## Improvement 2 — Session Context Injection

### What
Marcus currently synthesises without knowing what was worked on recently.
Inject the last 3 rows from `.yvon-os/SESSION.md` into Marcus's synthesis system prompt.

### Why
Marcus gives better strategic answers when he knows current context ("we just launched a campaign", "Hourbour MRR dropped last week").

### Implementation (Raj — `/api/team-chat/route.ts`)
Read `.yvon-os/SESSION.md` at the start of each War Room request:
```typescript
// Read last 3 session entries from SESSION.md
// Append to Marcus's synthesis system prompt as:
// "Recent context: [session entries]"
// Keep this injection under 150 tokens — summary only
```
This is a server-side file read — not exposed to the browser.

---

## Improvement 3 — Routing Transparency

### What
The existing `RoutingChain.tsx` shows which specialists were called.
Improve it to also show: (a) the keywords that triggered the match, (b) classifier confidence score.

### Why
When routing is unexpected, Stark can see exactly why Agent X was picked and tune his phrasing next time.

### Implementation (Raj — `/api/route-intent/route.ts`)
Extend the classifier response JSON:
```typescript
// Current response shape:
{ agents: ['kai-analyst', 'nate-growth'] }

// New response shape:
{
  agents: ['kai-analyst', 'nate-growth'],
  reasoning: {
    'kai-analyst': { matchedKeywords: ['analytics', 'metrics'], confidence: 0.91 },
    'nate-growth': { matchedKeywords: ['growth', 'funnel'], confidence: 0.78 }
  }
}
```

### UI (Mia — `components/RoutingChain.tsx`)
- Show matched keywords as small tags under each specialist chip
- Show confidence as a subtle percentage (e.g., "91% match")
- If @ mention forced the routing: show "Forced by @mention" badge instead of keywords

---

## Improvement 4 — Dev Mode Routing

### What
When Stark is working on the YVON codebase itself, the War Room should automatically surface the technical team (Dev, Raj, Quinn) as priority specialists instead of marketing/analytics agents.

### Why
Right now "add a new API route" could route to Kai or Alex incorrectly. Dev Mode makes technical sessions accurate.

### Implementation
Add a "Dev Mode" toggle to the War Room UI:
- Toggle sets a `warroom_mode` cookie: `business` (default) or `dev`
- In `dev` mode, the classifier is pre-seeded with technical keywords before running
- In `dev` mode, specialist pool is restricted to: dev-lead, raj-backend, mia-frontend, quinn-qa, priya-pm, leo-ui-designer
- Marcus still synthesises (he's always the final voice)

### UI (Mia — `components/WarRoom.tsx`)
- Small "Dev Mode" toggle chip in the War Room header (off by default)
- When on: header turns blue-tinted, label changes to "War Room — Dev Mode"
- Cookie `warroom_mode` persists until toggled off

---

## Acceptance Criteria (Quinn)
- [ ] `@mention` correctly routes to specified agent(s), bypassing classifier
- [ ] Hard cap of 2 specialists still enforced even with @ mentions
- [ ] Invalid @ mentions show inline warning, don't break the request
- [ ] SESSION.md context injection stays under 150 tokens in Marcus's prompt
- [ ] RoutingChain shows keywords + confidence for classifier-routed sessions
- [ ] RoutingChain shows "@mention" badge for forced routing
- [ ] Dev Mode toggle persists via cookie, restricts specialist pool correctly
- [ ] All changes pass `npm run lint` + `npx tsc --noEmit`
