# Rename Plan: YVON Engine → ToonGine & YVON2.0 → YVON OS

> **For Hermes:** Execute sequentially, one phase at a time. Verify before proceeding.

**Goal:** Rename both projects — npm package `yvon-engine` → `toongine`, main app `YVON2.0` → `YVON OS`. Zero downtime, keep `yvon.in`.

**Risk mitigation strategy:**
- Create `backup/before-rename` branch on BOTH repos before touching anything
- Verify build after EVERY change (not just at the end)
- Phase 1 completes entirely (engine published to npm) before Phase 2 touches the main app
- Phase 2 deploys to preview first, then aliases to `yvon.in`

---

## Phase 1: ToonGine (npm package) — 8 steps

### Files changed: 29 in `/root/yvon-engine/`

| # | File | Change |
|---|------|--------|
| 1 | `package.json:2` | `"name": "yvon-engine"` → `"toongine"` |
| 2 | `package.json:4` | description: "YVON Engine" → "ToonGine — TOON compression engine" |
| 3 | `package.json:31` | `"bin": {"yvon": "./cli/yvon.js"}` → `{"toongine": "./cli/toongine.js"}` |
| 4 | `package.json:33-34` | Remove `cli/` from files (CLI no longer shipped in package) |
| 5 | `package.json:63-66` | repository URL: `YVON-Engine` → `ToonGine` |
| 6 | `package.json:67` | author: "YVON OS" → keep |
| 7 | `README.md` | Title + install commands: `@yvon/engine` → `toongine`, `npx yvon` → `npx toongine` |
| 8 | `cli/yvon.js` → `cli/toongine.js` | Rename file + update shebang/intro text |
| 9 | `scripts/postinstall.js` | Any yvon-engine references |
| 10 | `src/index.ts` | Internal references to package name in error messages, logs |
| 11 | `src/adapters/mcp-client.ts` | Internal references |
| 12 | `src/toon/v2/stripper.ts` | Internal references |
| 13 | `src/toon/v3/engine.ts` | Internal references |
| 14 | `src/toon/v3/sync-writer.ts` | Internal references |
| 15 | `src/toon/v3/resolver.ts` | Internal references |
| 16 | `src/toon/v3/dual-docs.ts` | Internal references |
| 17 | `src/toon/auto/injector.ts` | Internal references |
| 18 | `src/toon/auto/index.ts` | Internal references |
| 19 | `src/toon/auto/hermes-bridge.ts` | Internal references |
| 20 | `tools/yvon-clean` → rename `tools/toongine-clean` | CLI tool |
| 21 | `tools/yvon-doctor` → rename `tools/toongine-doctor` | CLI tool |
| 22 | `tools/README.md` | Tool references |
| 23 | `src/dashboard/ui/{package.json,package-lock.json}` | Dashboard UI references |

### Phase 1 Steps

#### Step 1: Create backup branch
```bash
cd /root/yvon-engine
git checkout -b backup/before-rename
git push origin backup/before-rename
git checkout master
```

#### Step 2: Update package.json
- Rename `name`, `description`, `bin`, `repository`, `exports["./cli"]`
- Verify: `node -e "require('./package.json').name === 'toongine'"`

#### Step 3: Rename CLI file
```bash
mv cli/yvon.js cli/toongine.js
```
- Update shebang/usage text inside

#### Step 4: Update all source references (src/*.ts)
- Replace `yvon-engine` → `toongine` in all 15 source files
- Replace `YVON-Engine` → `ToonGine` in comments/strings

#### Step 5: Update tools + scripts
- `tools/yvon-clean` → `tools/toongine-clean`
- `tools/yvon-doctor` → `tools/toongine-doctor`
- `scripts/postinstall.js`: update references

#### Step 6: Rebuild and pack
```bash
npm run build          # tsc → dist/
npm pack --dry-run     # verify package contents
```

#### Step 7: Commit + push
```bash
git add -A
git commit -m "rename: yvon-engine → toongine (ToonGine)"
git push origin master
```

#### Step 8: Rename GitHub repo
- Rename `OfficialNovizio/YVON-Engine` → `OfficialNovizio/ToonGine` in GitHub
- Update local remote: `git remote set-url origin https://github.com/OfficialNovizio/ToonGine.git`

**Verify:** `npm pack --dry-run` shows `toongine-1.5.4.tgz` with correct structure.

---

## Phase 2: YVON OS (main app) — 6 steps

### Files changed: 12 in `/root/yvon/`

| # | File | Change |
|---|------|--------|
| 1 | `package.json:52` | `"yvon-engine": "github:..."` → `"toongine": "github:OfficialNovizio/ToonGine#master"` |
| 2 | `app/api/claude/route.ts:6` | `from 'yvon-engine/cie'` → `from 'toongine/cie'` |
| 3 | `app/api/dashboard/route.ts:11,195` | Import + comment |
| 4 | `app/api/yvon-dashboard-stats/route.ts:9,45,67` | Import + name string + comment |
| 5 | `app/api/session-sync/route.ts:2` | Import |
| 6 | `lib/toon.ts:13` | Comment |
| 7 | `lib/health/repository.ts:12` | `YVON2.0` → `YVON-OS` |
| 8 | `app/api/team-chat/mode-resolver.ts:136` | `/YVON2.0/` → `/YVON-OS/` |
| 9 | `agent-department/shared/skills/coding/01-karpathy.md:83` | Path |
| 10 | `scripts/smoke-github-direct.ts:29` | `YVON2.0` → `YVON-OS` |
| 11 | `CLAUDE.md` | All `YVON2.0` references, repo paths |
| 12 | `.git/config` | Remote URL |

### Phase 2 Steps

#### Step 1: Create backup branch
```bash
cd /root/yvon
git checkout -b backup/before-rename
git push origin backup/before-rename
git checkout master
```

#### Step 2: Update package.json dependency
```json
"toongine": "github:OfficialNovizio/ToonGine#master"
```

#### Step 3: Update all imports (5 files)
- `from 'yvon-engine/...'` → `from 'toongine/...'`

#### Step 4: Update internal references (7 files)
- `YVON2.0` → `YVON-OS` in strings, comments, repo paths

#### Step 5: Update CLAUDE.md
- All references to YVON2.0, engine names

#### Step 6: Rename GitHub repo + remote
- Rename `OfficialNovizio/YVON2.0` → `OfficialNovizio/YVON-OS`
- Update local remote

#### Step 7: Reinstall + build + deploy
```bash
npm uninstall yvon-engine
npm install             # pulls toongine from GitHub
npm run build           # verify compiles
npx vercel --prod       # deploy to preview
```
- Verify preview works
- Alias `yvon.in` to new deployment

**Verify:** `yvon.in/settings` shows Dashboard card, all pages load.

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| npm publish fails (2FA) | Medium | Low | We're using GitHub install, not npm registry |
| Import breakage after rename | Low | High | Verify build after every step |
| GitHub repo rename breaks CI | Medium | Medium | GitHub auto-redirects old URLs |
| Vercel deploy fails after rename | Low | High | Deploy to preview first, verify, then alias |
| `package-lock.json` stale references | Medium | Medium | Delete and regenerate |

## Verification Gates

After Phase 1: `npm pack --dry-run` shows `toongine-1.5.4.tgz` with correct structure.

After Phase 2 step 6: `npm run build` passes. All imports resolve.

After Phase 2 step 7: Preview deploy loads all 33 pages. `yvon.in` aliased.

---

**Ready to execute Phase 1 (engine) first. Proceed?**
