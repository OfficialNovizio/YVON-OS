# Hermes Features — What We Pull / Port / Improve

> Legend: **Pull** = real files copied from GitHub · **Port** = concept reimplemented in TS · **Bridge** = via MCP.
> Status: ☐ planned · ◐ in progress · ☑ live. Update weekly.

| # | Hermes feature | Mode | Where it lives in YVON | Connects to | Status |
|---|----------------|------|------------------------|-------------|--------|
| H1 | **Skill packs** (`optional-skills/*`) | Pull | `agent-department/shared/skills/hermes/` | Skill-recall → agent briefs (Workstream B) | ◐ files pulled, wiring pending |
| H2 | `subagent-driven-development` (plan→delegate→2-stage review) | Pull | `…/hermes/software-development/subagent-driven-development/` | Dev, Diana | ◐ |
| H3 | `code-wiki` (codebase mapping) | Pull | `…/hermes/software-development/code-wiki/` | Dev, Quinn | ◐ |
| H4 | `rest-graphql-debug` (API debugging) | Pull | `…/hermes/software-development/rest-graphql-debug/` | Raj | ◐ |
| H5 | `adversarial-ux-test` (hostile QA) | Pull | `…/hermes/dogfood/adversarial-ux-test/` | Quinn | ◐ |
| H6 | `page-agent` (frontend reasoning) | Pull | `…/hermes/web-development/page-agent/` | Mia | ◐ |
| H7 | `watchers` (devops monitoring) | Pull | `…/hermes/devops/watchers/` | Dev/ops | ◐ |
| H8 | **Learning loop** (skills from experience) | Port (TS) | new: skill-capture after verified fixes | All agents (feeds H1 recall) | ☐ Workstream F |
| H9 | **Skill format/standard** (SKILL.md frontmatter) | Pull/adopt | `agent-department/shared/skills/` convention | Skill loader | ☑ already match |
| H10 | **MCP server** (live Hermes runtime) | Bridge (optional) | sidecar, not in repo | MCP client | ☐ deferred (heavy) |

## How "connect with our agents" works (the wiring)
1. Pulled `SKILL.md` packs sit in `agent-department/shared/skills/hermes/`.
2. Workstream B fixes the **dead skill-recall** (`searchSkills` / `buildSpecialistBrief` is currently never called) so agents actually load relevant skills into their briefs.
3. The skill index includes the Hermes packs → the right pack surfaces for the right agent/task (e.g. Quinn gets `adversarial-ux-test`).
4. Workstream F (learning loop) writes NEW verified-fix skills back into the same index → compounding improvement.

## Improvements we add on top of upstream
- Map each pack to specific YVON agents (table above) rather than a generic pool.
- Gate skill application behind the build-verification gate (Workstream A) so a skill-driven fix is still compile-checked.
- Weekly re-sync keeps packs current; lockfile makes upstream drift visible in diffs.
