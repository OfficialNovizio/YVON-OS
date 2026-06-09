/**
 * C-skills verification — pulled Hermes packs load for the mapped agents.
 * Run: npx tsx scripts/test-cskills.ts
 */
import { buildHermesSkillBlock, packsForAgent } from '../lib/hermes-skills'

let failures = 0
const check = (n: string, c: boolean, e = '') => { console.log(`${c ? '✓' : '✗ FAIL'} ${n}${e ? ` — ${e}` : ''}`); if (!c) failures++ }

async function main() {
  const dev = await buildHermesSkillBlock('dev-lead')
  check('dev-lead gets Hermes packs', dev.length > 0, `${dev.length} chars`)
  check('dev-lead includes subagent-driven-development', /subagent-driven-development/.test(dev))
  check('dev-lead includes code-wiki + watchers', /code-wiki/.test(dev) && /watchers/.test(dev))

  const quinn = await buildHermesSkillBlock('quinn-qa')
  check('quinn-qa gets adversarial-ux-test', /adversarial-ux-test/.test(quinn))

  const mia = await buildHermesSkillBlock('mia-frontend')
  check('mia-frontend gets page-agent', /page-agent/.test(mia))

  const raj = await buildHermesSkillBlock('raj-backend')
  check('raj-backend gets rest-graphql-debug', /rest-graphql-debug/.test(raj))

  const lena = await buildHermesSkillBlock('lena-brand')
  check('unmapped agent (lena) gets empty block', lena === '' && packsForAgent('lena-brand').length === 0)

  console.log(failures === 0 ? '\n✅ C-skills PASSED — Hermes packs connect to the right agents.' : `\n❌ C-skills FAILED — ${failures}.`)
  process.exit(failures === 0 ? 0 : 1)
}
main()
