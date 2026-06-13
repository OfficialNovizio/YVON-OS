# SESSION.md — Rolling Session Memory
> Updated at the end of every session. Read at the start of every session.
> Gives continuity without relying on conversation history.
> Keep each entry to 1-2 lines. Maximum 5 sessions shown — oldest drops off when 6th is added.
> SESSION_SCHEMA_VERSION=1.0.0

---

## Active Right Now
- **Status:** War Room Pipeline Overhaul — COMPLETE ✅
- **Completed this session:**
  - `.toon/memory/agent-department/shared/skills/coding/01-karpathy.md`: Mode-aware tool boundaries — local mode + GitHub mode documented, "no local write access" absolute removed
  - `lib/types.ts`: Added CommandType, WarRoomPhase, PhaseStatus, PhaseEvent, IntentClassification, 6 new WarRoomEvent discriminants (phase_enter, phase_complete, qa_pass_result, escalation, agent_empty_output, agent_retry)
  - `lib/ai-client.ts`: Added classifyIntentSemantic() with Haiku primary + Sonnet fallback, 60s cache, all HARD RULES preserved in system prompt
  - `app/api/route-intent/route.ts`: Replaced keyword-only classifier with semantic primary path + legacy fallback, mapSemanticToRouting for specialist assignment
  - `app/api/team-chat/route.ts`: OS skills gate (4 skills injected into every specialist), empty-output detection (3-attempt auto-retry + escalation), Quinn QA visibility events (qa_pass_result, phase transitions), 5-phase pipeline events
  - `app/screens/war-room/_PhaseStepper.tsx`: New PhaseStepper component — 5-phase progress bar with status icons, QA pass results, retry counter, escalation banner
  - `app/screens/war-room/page.tsx`: Phase state tracking + SSE handlers + PhaseStepper integration
  - `tsc --noEmit` clean ✅
- **Completed this session:**
  - `app/api/route-intent/route.ts`: `CLASSIFIER_PROMPT` — added explicit SCREEN RULE to `technical_frontend` + critical rule that screen/component analysis never routes to `strategy`/`operations`; patched `strategy` rule to block code/screen keywords
  - `app/api/team-chat/route.ts`: `isAction` (specialist level) + `isActionRequest` (CEO level) — added `!isReport` / `!isReportRequest` guard so "Create a report on the code" no longer triggers action mode
  - `lib/agent-tools.ts`: `isBashAllowed` refactored to `isBashAllowedSingle` + pipeline handler — `| head`, `| tail`, `| sort`, `| wc`, `| grep` now allowed as safe terminal pipe targets
  - `tsc --noEmit` clean ✅
- **Still pending (roadmap):**
  - Competitor pipeline: test end-to-end with real Apify token
  - WebSearch not wired in /api/claude (YVN-001 — highest urgency feature gap)
  - Supabase RLS on multi-venture tables (YVN-002), Upstash rate limiting (YVN-004), Inbox approval UI (YVN-005)
  - Fill in Novizio + Hourbour ICP fields (NOV-001, HRB-007)
  - Hourbour trial-to-paid conversion flow (HRB-001)
  - Connect daily brief to real competitor data

---

## Open Decisions (not yet resolved)
- [ ] Auth provider — Supabase Auth built-in vs custom OAuth?
- [ ] Alert notification channel — email via Resend first or dashboard panel?
- [ ] Rate limiting — Upstash Redis required (free tier available)

---

## Last 5 Sessions

| Date | Agent(s) | Task | Outcome | Next Step |
|------|---------|------|---------|-----------|
| 2026-06-07 | Quinn, Dev | Using the fixes proposed by dev-lead, apply the changes; Review the Flutter/Dart codebase files referenced in th; Review the highlighted files (e.g., main.dart, auth_ser | 6 agent calls via War Room | Review CEO dashboard |
| 2026-06-07 | Quinn, Dev | Using the fixes proposed by dev-lead, apply the changes; Review the Flutter/Dart codebase files referenced in th; Review the highlighted files (e.g., main.dart, auth_ser | 6 agent calls via War Room | Review CEO dashboard |
| 2026-06-07 | Quinn, Dev | Using the fixes proposed by dev-lead, apply the changes; Review the Flutter/Dart codebase files referenced in th; Review the highlighted files (e.g., main.dart, auth_ser | 6 agent calls via War Room | Review CEO dashboard |
| 2026-06-07 | Quinn, Dev | Using the fixes proposed by dev-lead, apply the changes; Review the Flutter/Dart codebase files referenced in th; Review the highlighted files (e.g., main.dart, auth_ser | 6 agent calls via War Room | Review CEO dashboard |
| 2026-06-06 | Quinn, Dev, Raj, Mia, Kai | Review the highlighted files (e.g., main.dart, auth_ser; Using quinn-qa's bug report, open each highlighted file; After dev-lead has applied fixes, perform a thorough ve | 20 agent calls via War Room | Review CEO dashboard |
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Mia, Quinn, Dev, Raj | Using the fix specification from dev-lead, open lib/Wor; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Mia, Quinn, Dev, Raj | Using the fix specification from dev-lead, open lib/Wor; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Mia, Quinn, Raj | Investigate the import chain for `shift_screen.dart` (l; Open `shift_screen.dart` and locate the failing import ; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Mia, Quinn, Dev, Raj | Using the fix specification from dev-lead, open lib/Wor; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
You are Quinn, QA | 29 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Mia, Quinn, Dev, Raj | Using the fix specification from dev-lead, open lib/Wor; ⛔ RELENTLESS QA REVIEW — pass 1 of 3
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
You are Quinn, QA; Review the diagnostic table from prior conversation. In | 26 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Quinn, Dev, Mia, Raj | Using the error report and proposed fixes from dev-lead; Investigate the shift GetX screen (likely `shift_screen; After Mia has committed the fixes, check out the latest | 21 agent calls via War Room | Review CEO dashboard |
Read every file the specialist | 15 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Quinn, Mia, Raj | In shift_getx.dart, fix the following 4 bugs: (1) Repla; After dev-lead has applied the fixes, verify the change; Investigate all shift-related GetX controllers (e.g., S | 12 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Raj, Mia, Quinn | War Room pipeline overhaul: semantic classifier, OS skills gate, empty-output detection, QA loop visibility, PhaseStepper UI, karpathy mode fix | 7 files, 524+ lines, tsc clean, Quinn QA 7/7 PASS | Deploy, monitor classifier accuracy |
| 2026-06-04 | Dev, Quinn, Mia, Raj | In shift_getx.dart, fix the following 4 bugs: (1) Repla; After dev-lead has applied the fixes, verify the change; Investigate all shift-related GetX controllers (e.g., S | 12 agent calls via War Room | Review CEO dashboard |
| 2026-06-04 | Dev, Quinn, Mia, Raj | In shift_getx.dart, fix the following 4 bugs: (1) Repla; After dev-lead has applied the fixes, verify the change; Investigate all shift-related GetX controllers (e.g., S | 12 agent calls via War Room | Review CEO dashboard |
Read every file the specialist; Quinn QA found errors. Fix ALL of them — do not stop un; QA REVIEW — pass 2 of 3

Read every file the specialist | 17 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Quinn, Mia, Dev | QA REVIEW — pass 1 of 3
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
Read every file the specialist; Quinn QA found errors. Fix ALL of them — do not stop un; QA REVIEW — pass 2 of 3

Read every file the specialist | 17 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
| 2026-05-30 | Mia, Dev, Quinn | Take the existing multi-file Flutter project and physic; Define the architectural structure for the single-file ; Review the Expense data model and the existing demo dat | 10 agent calls via War Room | Review CEO dashboard |
---

## Last Clean Exit: 2026-06-08 17:22

## SIP Flags (Pending Distillation)
- No pending SIP flags

---

## How to Update This File
At the end of each session, the executing agent:
1. Moves "Active Right Now" to the top of the sessions table (newest first)
2. Fills in Date, Agent(s), Task, Outcome, Next Step
3. Drops the oldest row if there are already 5 entries
4. Writes a new "Active Right Now" section if a task is still in progress
