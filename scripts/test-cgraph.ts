/**
 * C-graph verification — queryImpact against the real hourbour repo for the
 * exact symbols whose dangling references caused the 7 regressions.
 * Run: npx tsx scripts/test-cgraph.ts
 */
import { queryImpact, formatImpact } from '../lib/graph-memory'

const REPO = '/Users/novysingh/StudioProjects/hourbour'
let failures = 0
function check(name: string, cond: boolean, extra = '') {
  console.log(`${cond ? '✓' : '✗ FAIL'} ${name}${extra ? ` — ${extra}` : ''}`)
  if (!cond) failures++
}

async function main() {
  // buildOverviewForMonth: extraction left callers dangling → must surface call sites
  const a = await queryImpact(REPO, 'buildOverviewForMonth')
  check('finds buildOverviewForMonth references', a.count > 0, `${a.count} refs in ${a.fileCount} files`)
  check('points at the dangling caller file', a.hits.some(h => /OverviewGetx\.dart/i.test(h.file)))

  // shiftRepo: param used at call sites but not defined on ctor
  const b = await queryImpact(REPO, 'shiftRepo')
  check('finds shiftRepo references', b.count > 0, `${b.count} refs in ${b.fileCount} files`)

  // ShiftController: the god controller — many references expected
  const c = await queryImpact(REPO, 'ShiftController')
  check('finds ShiftController references across many files', c.fileCount >= 2, `${c.fileCount} files`)

  // A symbol that should not exist → zero refs, helpful "new" message
  const d = await queryImpact(REPO, 'ZzzDefinitelyNotARealSymbol123')
  check('non-existent symbol returns zero refs', d.count === 0)
  check('zero-ref message reads as "new"', /No references/.test(formatImpact(d)))

  console.log('\n--- sample formatImpact(buildOverviewForMonth) ---')
  console.log(formatImpact(a).split('\n').slice(0, 8).join('\n'))

  console.log(failures === 0 ? '\n✅ C-graph PASSED — impact/reference query works on the live venture repo.' : `\n❌ C-graph FAILED — ${failures} check(s).`)
  process.exit(failures === 0 ? 0 : 1)
}
main()
