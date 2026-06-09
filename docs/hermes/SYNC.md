# Hermes Sync — Weekly Pull

Keeps the vendored Hermes skill packs current with upstream.

## Run
```bash
node scripts/hermes-sync.mjs
```
- Pulls the curated packs (see `SKILLS[]` in the script) from `nousresearch/hermes-agent@main`.
- Writes files to `agent-department/shared/skills/hermes/`.
- Updates `docs/hermes/skills-lock.json` (per-file upstream blob SHAs).
- Appends a dated line to `WEEKLY-LOG.md`.
- Skips files whose SHA is unchanged → clean diffs, cheap re-runs.

## Add / remove a pack
Edit the `SKILLS` array in `scripts/hermes-sync.mjs`, then re-run. Then map the new pack to its agent(s) in `FEATURES.md` + `SKILLS-REGISTRY.md`.

## Weekly cadence
Either run manually each week, or schedule it (e.g. a cron/CI job). After each sync:
1. Review the diff (upstream may have changed a skill).
2. Update `WEEKLY-LOG.md` with anything notable.
3. If a pack changed materially, re-check its agent mapping in `FEATURES.md`.

## License / attribution
Hermes is MIT. The upstream `LICENSE` is pulled into `agent-department/shared/skills/hermes/LICENSE`, and each `SKILL.md` keeps its `author` + `license` frontmatter. Do not strip these.

## Boundary
This script only pulls **portable skill files**. It does NOT pull Hermes's Python runtime, gateways, or CLI — those are not used in YVON (see README.md → "What Hermes is").
