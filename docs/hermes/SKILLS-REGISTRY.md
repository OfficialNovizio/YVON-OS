# Hermes Skills Registry

> The exact packs pulled into YVON, their agent mapping, and connection status.
> Source: `nousresearch/hermes-agent@main` (MIT). Last synced: **2026-06-06** (17 files).
> Lockfile: `skills-lock.json`. Re-sync: `node scripts/hermes-sync.mjs`.

| Pack | Local path (`agent-department/shared/skills/hermes/`) | Agent(s) | Why | Connected? |
|------|------|----------|-----|-----------|
| subagent-driven-development | `software-development/subagent-driven-development/` | Dev, Diana | plan → delegate → 2-stage review workflow | ☐ pending wiring |
| code-wiki | `software-development/code-wiki/` | Dev, Quinn | map a codebase before changing it (anti-re-exploration) | ☐ |
| rest-graphql-debug | `software-development/rest-graphql-debug/` | Raj | systematic API/backend debugging | ☐ |
| adversarial-ux-test | `dogfood/adversarial-ux-test/` | Quinn | hostile QA — find what breaks before users do | ☐ |
| page-agent | `web-development/page-agent/` | Mia | structured frontend/page reasoning | ☐ |
| watchers | `devops/watchers/` | Dev/ops | monitor GitHub/HTTP/RSS (incl. scripts) | ☐ |

**Connected?** = loaded into agent briefs via skill-recall. Flips to ☑ when Workstream B (fix the dead `searchSkills`/`buildSpecialistBrief` path) ships and the pack is indexed for its agent.

## Pulled files (17)
- `LICENSE` (MIT, upstream attribution)
- `software-development/subagent-driven-development/` — SKILL.md + references/{context-budget-discipline, gates-taxonomy}.md
- `software-development/code-wiki/` — SKILL.md + templates/{README, architecture, getting-started, module}.md
- `software-development/rest-graphql-debug/SKILL.md`
- `dogfood/adversarial-ux-test/SKILL.md`
- `web-development/page-agent/SKILL.md`
- `devops/watchers/` — SKILL.md + scripts/{_watermark, watch_github, watch_http_json, watch_rss}.py

## To add more packs
Edit `SKILLS[]` in `scripts/hermes-sync.mjs`, re-run, then add a row above + map to agent(s).
Candidate next pulls: `research/*`, `productivity/*`, `security/web-pentest`, `mlops/*`.
