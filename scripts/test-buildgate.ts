/**
 * D verification — build-gate parses hourbour's real analyzer output and detects
 * the agent-introduced regressions. Run: npx tsx scripts/test-buildgate.ts
 */
import { detectStack, runAnalyze, parseAnalyzerLine, errorKey, newErrors, type BuildError } from '../lib/build-gate'

const REPO = '/Users/novysingh/StudioProjects/hourbour'
let failures = 0
const check = (n: string, c: boolean, e = '') => { console.log(`${c ? '✓' : '✗ FAIL'} ${n}${e ? ` — ${e}` : ''}`); if (!c) failures++ }

async function main() {
  // Parser handles both separator styles + spaced paths
  const a = parseAnalyzerLine("  error • The named parameter 'shiftRepo' isn't defined • lib/Working UI/Controllers.dart:49:80 • undefined_named_parameter")
  check('parses • format + spaced path', !!a && a.file === 'lib/Working UI/Controllers.dart' && a.line === 49 && a.severity === 'error')
  const b = parseAnalyzerLine('   info - lib/models/Payment Method Model.dart:283:10 - The local variable starts with underscore - no_leading_underscores')
  check('parses - format + spaced path', !!b && b.file === 'lib/models/Payment Method Model.dart' && b.severity === 'info')

  check('detects flutter stack', (await detectStack(REPO)) === 'flutter')

  const res = await runAnalyze(REPO)
  check('analyze ran', res.ran, res.skippedReason ?? '')
  // Repo is a moving target (live runs edit it) — assert the gate parses real,
  // well-formed errors rather than a pinned count.
  check('finds compile errors with well-formed fields', res.errors.length > 0 &&
    res.errors.every(e => e.file.length > 0 && e.line > 0 && e.message.length > 0), `${res.errors.length} errors`)

  // Regression diff — deterministic synthetic data (independent of repo state).
  const mk = (file: string, message: string): BuildError => ({ severity: 'error', file, line: 1, col: 1, message })
  const base = [mk('a.dart', 'old error')]
  const cur = [mk('a.dart', 'old error'), mk('b.dart', 'new error 1'), mk('b.dart', 'new error 2')]
  const reg = newErrors(base, cur)
  check('newErrors() excludes baseline, surfaces only the new ones',
    reg.length === 2 && reg.every(e => e.file === 'b.dart') && !reg.some(e => e.message === 'old error'))

  console.log(`\n--- ${res.errors.length} errors the gate currently reports on hourbour ---`)
  console.log(res.errors.map(e => `${e.file}:${e.line} — ${e.message}`).join('\n'))

  console.log(failures === 0 ? '\n✅ D PASSED — build gate parses real output + detects regressions.' : `\n❌ D FAILED — ${failures}.`)
  process.exit(failures === 0 ? 0 : 1)
}
main()
