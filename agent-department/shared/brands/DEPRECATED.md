# ⛔ DEPRECATED — Do Not Load

This folder (`agent-department/shared/brands/`) is no longer the source of truth for brand context.

**Migration completed: 2026-05-15**

Brand content has been moved to venture-specific files in `docs/ventures/`:

| Old file | Replaced by |
|----------|------------|
| `brands/novizio.md` | `docs/ventures/novizio/BRAND.md` + `CONTEXT.md` + `FEEDBACK.md` + `DESIGN.md` |
| `brands/hourbour.md` | `docs/ventures/hourbour/BRAND.md` + `CONTEXT.md` + `FEEDBACK.md` + `DESIGN.md` |

## Why deprecated

The old brand stubs mixed short-term state (campaigns, open decisions) with long-term identity in a single file. When sessions switched ventures, stale context from the previous venture persisted in agent memory.

The new structure uses isolated, per-venture folders. Marcus reads the correct venture files fresh at session start and injects scoped context using `[NOVIZIO-*]` / `[HOURBOUR-*]` prefixes.

## What to do

**If you are an agent reading this:** Stop here. Load `docs/ventures/[active]/` instead.
**If you are editing brand content:** Edit `docs/ventures/[name]/BRAND.md` — not this folder.
**Delete these files?** Keep them as tombstones until next curator run confirms all references are updated.
