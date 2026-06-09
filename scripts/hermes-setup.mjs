/**
 * scripts/hermes-setup.mjs — fetch the Hermes Agent runtime for the aux-tools sidecar.
 *
 * Clones nousresearch/hermes-agent (MIT) into hermes/vendor/ (gitignored), shallow.
 * Cross-platform (Mac + Windows): uses `git` via Node, no bash-only syntax.
 *
 *   node scripts/hermes-setup.mjs
 *
 * This only fetches the code. Running it (Python env + its tools MCP) is done via
 * Docker — see docs/hermes/SIDECAR.md. The aux-tools MCP exposes web_search,
 * browser automation, vision, image-gen, skills_list, kanban (NOT the learning
 * loop/memory — those are native, see lib/learning-loop.ts).
 */
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VENDOR = join(ROOT, 'hermes', 'vendor')
const REPO = 'https://github.com/nousresearch/hermes-agent.git'

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

try {
  if (existsSync(join(VENDOR, '.git'))) {
    console.log('▶ Hermes already cloned — pulling latest…')
    run('git', ['-C', VENDOR, 'pull', '--ff-only'])
  } else {
    mkdirSync(dirname(VENDOR), { recursive: true })
    console.log(`▶ Cloning Hermes (shallow) into hermes/vendor …`)
    run('git', ['clone', '--depth', '1', REPO, VENDOR])
  }
  console.log('\n✅ Hermes runtime fetched to hermes/vendor/')
  console.log('   Next: see docs/hermes/SIDECAR.md to run it via Docker and connect its tools.')
} catch (e) {
  console.error('❌ Hermes setup failed:', e.message)
  console.error('   Ensure git is installed and you have network access.')
  process.exit(1)
}
