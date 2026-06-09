# War Room — Master Plan (v3, consolidated)

> Triple-pass reviewed (generate → critique → fix). Refinements from the critique are tagged **[crit]**.
> Status: PART 1 already shipped (local, not pushed). PART 2 awaiting single approval.
> Locked decisions: Hermes → adopt natively + pull real skill files. Thinking → toggle + safe fallback.

---

## PART 1 — Already done this session (local, not pushed)

| # | Change | Files | Verified |
|---|--------|-------|----------|
| D1 | **Synthesis verification (Option B)** — Marcus reads the changed files and confirms before claiming "fixed"; fixed the prompt/tool contradiction; iteration budget scales to # changed files | `synthesize-stage.ts` | tsc ✓ |
| D2 | **cache_control fix** — single trailing breakpoint, can never exceed Anthropic's 4-block limit (was the "stops mid-verify" crash) | `tool-loop.ts` | tsc ✓ |
| D3 | **Fail-closed QA** — no parseable verdict → FAIL → **re-validate (never edit good code)**; lenient status parsing | `validate-stage.ts` | tsc ✓ |
| D4 | **Spaced-path regex** — extension-anchored so `Working UI/Shift/Shift Screen.dart` is captured whole | `synthesize-stage.ts`, `validate-stage.ts` | empirically ✓ |
| D5 | **Persist agent work** — tool_calls + turn_index stored; agent cards (with tools) restore on refresh / history | migration 049, `types.ts`, `execute-stage.ts`, `validate-stage.ts`, `route.ts`, `db.ts`, `page.tsx` | tsc ✓, migration applied ✓ |
| D6 | **Hermes skills pulled** — 6 MIT packs (17 files) + weekly sync + tracking docs | `scripts/hermes-sync.mjs`, `docs/hermes/*`, `agent-department/shared/skills/hermes/*` | sync ran ✓ |

---

## PART 2 — The plan (pending approval)

### Verified root causes
| # | Problem | Evidence |
|---|---------|----------|
| R1/R2 | Agents ship broken fixes & claim success; **no build gate** | `flutter analyze` = 7 errors the agents introduced; nothing compiles after fixing |
| R3 | Reads/Bash fail on spaced paths | bash sandbox blocks quoted abs paths (`agent-tools.ts:262`) |
| R4 | Redundant tree re-exploration + file re-reads | no shared cache; Quinn has no snapshot |
| R5 | Agents don't use learned memory / recalled skills | `buildSpecialistBrief` (only loader of MEMORY + skills) is never called |
| R6 | Continue-from-history stalls | autoApprove branch (`route.ts:416-444`) emits plan then close()s — no execution |
| R7 | Thinking off for all agents | disabled for non-Claude models |

### Workstream A — Correctness (stop shipping broken code)
- **A1 Build gate (local mode).** New `build-gate.ts`: run `flutter analyze` via execP in `localRepoPath`. Baseline BEFORE fixes; after fixes compute NEW errors. Feed exact `file:line` to the right specialist → re-fix → re-analyze, **cap 3 rounds [crit]**. Marcus gets the real verdict; cannot claim "fixed" while errors remain.
- **A2 Spaced-path reliability.** Fix `isBashAllowedSingle` to accept quoted paths validated inside `localRepoPath`; steer agents to Read/Glob/Grep + real full paths.

### Workstream C — Efficiency (kill redundant reads) — front-loaded [crit: benefits every later phase]
- **C1 Tree-explore dedup.** Build the repo tree ONCE per session; cache by `localRepoPath` with **TTL + write-invalidation [crit]**; serve Glob/Grep/ls from cache; give agents the COMPLETE target subtree labeled "do not re-explore."
- **C2 Content dedup.** Cache file contents on first Read (cross-agent, **size-capped, invalidate on write [crit]**); inject analyzer-read contents into fixer/QA briefs so they edit without re-reading.

### Workstream D — Continuation (resume any history chat)
- **D1 Fix autoApprove.** Make follow-ups actually execute Phase 2 — **only when sessionId + history present, so the first-turn approval gate (WORKFLOW RULE 4) stays intact [crit]**. Fallback: if execution can't start, show the approval card (never silently stall).
- **D2 Carry context.** Reuse sessionId, pass full conversationHistory, restore agent cards (D5 already done) → resumed thread continues + appends to the same plan.

### Workstream B — Capability (agents use their powers) + Hermes connection
- **B1 Wire memory + skills into every brief.** Merge `buildSpecialistBrief`'s recall (agent MEMORY.md, `searchSkills`, venture memories, OS-context) into analyzer/fixer/validator briefs; retire the dead path. **Size-cap + cache recall to avoid prompt bloat [crit].**
- **B2 Quinn gets snapshot + QA memory** (stops re-exploration, catches known bug patterns).
- **B3 Connect Hermes packs.** Index the pulled `agent-department/shared/skills/hermes/*` packs into the skill-recall store and map each to its agent (registry table) so the right pack surfaces (e.g. Quinn ← adversarial-ux-test). **Without B1/B3 the pulled files are inert [crit].**

### Workstream E — Reasoning (thinking toggle)
- **E1** Top-bar toggle, default ON, all agents. tool-loop **catches the specific thinking-rejection error and retries once without thinking [crit]**. Reliable on Claude, best-effort on DeepSeek. **Note: thinking adds latency/tokens — toggle lets you trade speed vs depth [crit].**

### Workstream F — Hermes learning loop, native (depends on B1/B3)
- **F1 Learning loop.** After a **build-gate-VERIFIED** fix [crit], capture a reusable skill note → memory/DB; B1 recall surfaces it next time.
- **F2 Cross-session recall.** Resume + search past sessions.

---

## Recommended sequence (revised by [crit])
**A1 → A2 → C1 → C2 → D1 → D2 → B1 → B2 → B3 → E1 → F1 → F2**
Front-loads your three felt pains (correctness, token waste, continuation); C early because it cuts the cost of testing every later phase; B before F because the learning loop feeds skill recall.

## Per-phase verification [crit]
After each workstream: `npx tsc --noEmit` green + one live War Room run on hourbour to confirm behavior (e.g. after A1, re-run "fix all issues" and confirm `flutter analyze` errors actually drop and Marcus reports the true count).

## Fallback checklist
- Flutter/dart not on PATH → skip gate, warn, read-based QA (never claim "verified").
- GitHub mode (Vercel) → build gate local-only by design; surfaced.
- Errors remain after 3 rounds → STOP, report exact file:line, status "N ERRORS REMAIN".
- Thinking rejected → retry without it, mark thinking_unavailable once.
- Spaced path still fails in bash → agent switches to Read/Glob/Grep.
- Cache stale → invalidate on write_file to that path.
- Regression introduced → baseline diff catches it → route back to author agent.
- Memory/skill recall errors (DB down) → brief still builds with persona + OS skills (graceful degrade).
- Continuation can't start → fall back to approval card, never silent stall.

## Guardrails (non-negotiable)
- Preserve the approval gate (WORKFLOW RULE 4) + local-mode sandbox.
- Gate on `error` severity, not the 818 info-lints.
- `npx tsc --noEmit` green after each phase; nothing pushed (all local) until you say so.
