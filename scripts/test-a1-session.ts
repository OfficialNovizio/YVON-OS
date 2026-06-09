/**
 * A1 verification — per-session isolation under concurrency.
 * Run: npx tsx scripts/test-a1-session.ts
 */
import {
  createSession, runInSession, currentSession,
  sessionCacheGetFile, sessionCacheSetFile, sessionCacheInvalidate,
  sessionQueryGet, sessionQuerySet,
} from '../lib/session'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
let failures = 0
function check(name: string, cond: boolean) {
  console.log(`${cond ? '✓' : '✗ FAIL'} ${name}`)
  if (!cond) failures++
}

async function main() {
  // ── 1. Two concurrent sessions, SAME cache key, DIFFERENT values → no leakage ──
  const seen: Record<string, string | undefined> = {}
  const ids: Record<string, string | undefined> = {}
  async function run(name: string, value: string, jitter: number) {
    const s = createSession({ repoMode: 'local', localRepoPath: `/repo/${name}` })
    await runInSession(s, async () => {
      sessionCacheSetFile('/same/path.dart', value)   // same key in both runs
      await delay(jitter)                              // force interleaving
      seen[name] = sessionCacheGetFile('/same/path.dart')
      ids[name] = currentSession()?.id
      await delay(jitter)
      // re-read after the other session has also written — must still be OURS
      seen[name + '2'] = sessionCacheGetFile('/same/path.dart')
    })
  }
  await Promise.all([run('A', 'AAA', 12), run('B', 'BBB', 5), run('C', 'CCC', 9)])
  check('session A sees only its own value', seen.A === 'AAA' && seen.A2 === 'AAA')
  check('session B sees only its own value', seen.B === 'BBB' && seen.B2 === 'BBB')
  check('session C sees only its own value', seen.C === 'CCC' && seen.C2 === 'CCC')
  check('each concurrent session got a distinct id', new Set([ids.A, ids.B, ids.C]).size === 3)

  // ── 2. Cache hit within a session ──
  await runInSession(createSession({ repoMode: 'local' }), async () => {
    sessionCacheSetFile('/f.dart', 'content')
    const a = sessionCacheGetFile('/f.dart')
    const b = sessionCacheGetFile('/f.dart')
    check('repeated read served from cache', a === 'content' && b === 'content')
    check('cacheHits counted', (currentSession()?.stats.cacheHits ?? 0) >= 2)
  })

  // ── 3. Invalidation (write → stale content never served) ──
  await runInSession(createSession({ repoMode: 'local' }), async () => {
    sessionCacheSetFile('/w.dart', 'old')
    sessionCacheInvalidate('/w.dart')
    check('invalidated entry is a miss', sessionCacheGetFile('/w.dart') === undefined)
    check('invalidation counted', (currentSession()?.stats.invalidations ?? 0) === 1)
  })

  // ── 3b. E: structure-query cache (Glob/Grep) hit + write clears it ──
  await runInSession(createSession({ repoMode: 'local' }), async () => {
    sessionQuerySet('glob:/r:*.dart', 'a.dart\nb.dart')
    check('query cache hit', sessionQueryGet('glob:/r:*.dart') === 'a.dart\nb.dart')
    sessionCacheInvalidate('/r/c.dart')   // a write → listings may change → query cache cleared
    check('write clears the query cache', sessionQueryGet('glob:/r:*.dart') === undefined)
  })

  // ── 3c. E: query cache isolated across concurrent sessions ──
  const qseen: Record<string, string | undefined> = {}
  async function qrun(name: string, val: string, jitter: number) {
    await runInSession(createSession({ repoMode: 'local' }), async () => {
      sessionQuerySet('glob:/same:*.dart', val)
      await delay(jitter)
      qseen[name] = sessionQueryGet('glob:/same:*.dart')
    })
  }
  await Promise.all([qrun('X', 'x.dart', 8), qrun('Y', 'y.dart', 4)])
  check('query cache isolated across sessions', qseen.X === 'x.dart' && qseen.Y === 'y.dart')

  // ── 4. No active session (flag off / legacy) → all helpers are safe no-ops ──
  check('currentSession undefined outside a session', currentSession() === undefined)
  sessionCacheSetFile('/x', 'y')                 // must not throw
  check('get outside a session returns undefined', sessionCacheGetFile('/x') === undefined)
  sessionCacheInvalidate('/x')                   // must not throw

  console.log(failures === 0 ? '\n✅ A1 PASSED — sessions isolated, cache + invalidation correct.' : `\n❌ A1 FAILED — ${failures} check(s).`)
  process.exit(failures === 0 ? 0 : 1)
}
main()
