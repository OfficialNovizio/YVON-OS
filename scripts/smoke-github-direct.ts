/**
 * Hits the GitHub API directly (no lib imports) to verify auth + connectivity.
 * Run: npx tsx --env-file=.env.local scripts/smoke-github-direct.ts
 */

async function probe(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'YVON-smoke/1.0',
    },
  })
  if (res.status === 404) return { ok: false, status: 404, error: 'not found' }
  if (!res.ok) return { ok: false, status: res.status, error: await res.text() }
  const d = await res.json() as { full_name: string; default_branch: string; open_issues_count: number; updated_at: string }
  return { ok: true, full_name: d.full_name, branch: d.default_branch, issues: d.open_issues_count, updated: d.updated_at }
}

async function main() {
  if (!process.env.GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN not set in .env.local')
    process.exit(1)
  }
  console.log('=== GitHub probe ===')
  const candidates = [
    { owner: 'OfficialNovizio', repo: 'hourbour' },
    { owner: 'stark-labs',      repo: 'hourbour' },
    { owner: 'OfficialNovizio', repo: 'YVON-OS' },
  ]
  for (const { owner, repo } of candidates) {
    const r = await probe(owner, repo)
    if (r.ok) console.log(`✓ ${owner}/${repo}  branch=${r.branch}  issues=${r.issues}  updated=${r.updated?.slice(0,10)}`)
    else console.log(`✗ ${owner}/${repo}  ${r.status} ${r.error?.toString().slice(0, 80)}`)
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
