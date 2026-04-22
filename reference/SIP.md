# SIP.md — Skill Improvement Protocol
> Run after any task involving 3+ tool calls. Goal: distillation, not accumulation.

## Trigger Conditions
Run SIP if ANY of the following are true:
- A new pattern, command, or file was discovered not yet in the agent's files
- An existing rule/command was found to be wrong, stale, or replaced
- A better approach to a recurring task was found

## Steps
1. **Identify** — one pattern worth keeping, one that is stale or wrong
2. **Invoke skill-creator** — prompt: `"SIP update [AgentId]/SKILLS.md: add [new pattern], remove/condense [stale pattern]"`
3. **skill-creator edits** — adds pattern, removes stale one, appends one row to Distillation Log
4. **Hard cap enforced** — SKILLS.md must not exceed its cap (shown in Distillation Log header)

## Files SIP Applies To
| File | Action |
|------|--------|
| `SKILLS.md` | Add distilled patterns; remove stale; update Distillation Log |
| `COMMANDS.md` | Remove failed/deprecated commands; add proven patterns to Command Health log |
| `FILES.md` | Remove refs to deleted/moved files; add newly discovered useful files |

## Token Rule
SIP is distillation, not accumulation. Total line count must not increase after a SIP run.
If a line is added, a line must be condensed or removed.
Goal: higher quality in the same or fewer tokens.
