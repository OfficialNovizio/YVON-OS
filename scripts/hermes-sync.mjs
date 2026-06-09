/**
 * scripts/hermes-sync.mjs — Pull curated Hermes Agent skill packs from GitHub
 * into YVON, so our agents can use them. Hermes is MIT-licensed (attribution kept).
 *
 * Run weekly:  node scripts/hermes-sync.mjs
 *
 * - Pulls the curated SKILL.md packs (and their references/scripts) listed in SKILLS[]
 *   from nousresearch/hermes-agent into agent-department/shared/skills/hermes/.
 * - Writes a lockfile (docs/hermes/skills-lock.json) with per-file blob SHAs + date.
 * - Appends a dated entry to docs/hermes/WEEKLY-LOG.md.
 * - Skips unchanged files (SHA match) so re-syncs are cheap and diffs are clean.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const REPO = 'nousresearch/hermes-agent'
const BRANCH = 'main'
const DEST = join(ROOT, 'agent-department/shared/skills/hermes')
const LOCK = join(ROOT, 'docs/hermes/skills-lock.json')
const LOG  = join(ROOT, 'docs/hermes/WEEKLY-LOG.md')

// ── Curated skill packs (engineering / workflow / QA relevant to YVON agents) ──
// Edit this list to add/remove packs. Each is a dir prefix under the Hermes repo.
const SKILLS = [
  'optional-skills/software-development/subagent-driven-development',
  'optional-skills/software-development/code-wiki',
  'optional-skills/software-development/rest-graphql-debug',
  'optional-skills/dogfood/adversarial-ux-test',
  'optional-skills/web-development/page-agent',
  'optional-skills/devops/watchers',
]
// Always pull the upstream license alongside the skills (MIT attribution).
const EXTRA_FILES = ['LICENSE']

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'yvon-hermes-sync' },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`)
  return res.json()
}

async function raw(path) {
  const res = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`, {
    headers: { 'User-Agent': 'yvon-hermes-sync' },
  })
  if (!res.ok) throw new Error(`raw ${res.status} for ${path}`)
  return res.text()
}

async function main() {
  console.log(`▶ Hermes sync from ${REPO}@${BRANCH}`)
  const tree = (await gh(`git/trees/${BRANCH}?recursive=1`)).tree
  const prevLock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : { files: {} }
  const lock = { repo: REPO, branch: BRANCH, syncedAt: new Date().toISOString(), files: {} }

  const wanted = tree.filter(t =>
    t.type === 'blob' &&
    (SKILLS.some(s => t.path === s || t.path.startsWith(s + '/')) || EXTRA_FILES.includes(t.path)),
  )

  let pulled = 0, skipped = 0
  for (const f of wanted) {
    // Map repo path → local path. 'optional-skills/X' → hermes/X ; 'LICENSE' → hermes/LICENSE
    const rel = f.path.startsWith('optional-skills/') ? f.path.slice('optional-skills/'.length) : f.path
    const localPath = join(DEST, rel)
    if (prevLock.files[f.path] === f.sha && existsSync(localPath)) {
      lock.files[f.path] = f.sha; skipped++; continue
    }
    const content = await raw(f.path)
    mkdirSync(dirname(localPath), { recursive: true })
    writeFileSync(localPath, content, 'utf8')
    lock.files[f.path] = f.sha; pulled++
    console.log(`  ✓ ${rel}`)
  }

  mkdirSync(dirname(LOCK), { recursive: true })
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n', 'utf8')

  const logLine = `- ${new Date().toISOString().slice(0, 10)} — synced ${SKILLS.length} packs (${pulled} files updated, ${skipped} unchanged) from ${REPO}@${BRANCH}\n`
  if (existsSync(LOG)) writeFileSync(LOG, readFileSync(LOG, 'utf8') + logLine)
  console.log(`\n✅ Done: ${pulled} updated, ${skipped} unchanged → ${DEST}`)
}

main().catch(e => { console.error('❌ Hermes sync failed:', e.message); process.exit(1) })
