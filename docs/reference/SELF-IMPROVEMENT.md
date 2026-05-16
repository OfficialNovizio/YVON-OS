# SELF-IMPROVEMENT.md — Learning Loop Protocol
> Replaces both SIP.md and the old self-improvement system. Single source of truth for post-task reflection.

Run automatically during the **Adjourning** stage (Tuckman Stage 5) of any task with ≥3 tool calls.

## The 3-Question Check

### 1. Repeat error?
Did this exact problem happen before? Check `memory/feedback.md` Never Again section.
→ YES → Flag it. If it's in memory and still happened, the Forming stage missed it.

### 2. User correction?
Did the user correct how I did something?
→ YES → Extract the rule. Save to `memory/feedback.md` under the relevant section. Don't create a new file.

### 3. Discovery?
Did I learn something about the codebase, the user's preference, or a better pattern?
→ YES → Save to `memory/feedback.md`. If it affects other agents, also write to `.yvon-os/CONTEXT.md`.

## Consolidation Rule
**All feedback goes to ONE file: `memory/feedback.md`.** Never create separate files. If a rule exists, update it — don't duplicate.

## Token Rule
Adding a line to feedback.md requires condensing or removing an older line. Goal: higher quality, not more quantity.

## Cross-Agent Broadcast
If the learning affects other agents: write to `.yvon-os/CONTEXT.md`. Marcus broadcasts during next CEO brief.

## File Cleanup
SIP.md has been merged into this file. Only `SELF-IMPROVEMENT.md` survives.
