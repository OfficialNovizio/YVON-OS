/* eslint-disable @typescript-eslint/no-explicit-any */
/** Repository health — GitHub API for PRs, issues, build status */
import { getSecret } from '@/lib/secrets'
export interface RepoHealthResult {
  status: 'pass' | 'fail' | 'warn'
  details: Record<string, { status: string; value: any }>
}

export async function checkRepositoryHealth(): Promise<RepoHealthResult> {
  const details: Record<string, { status: string; value: any }> = {}
  const token = await getSecret('GITHUB_TOKEN')
  const repo = process.env.GITHUB_REPO || 'OfficialNovizio/YVON2.0'

  // Open PRs
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=5`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const prs: any[] = await res.json()
      const oldPrs = prs.filter(p => (Date.now() - new Date(p.created_at).getTime()) > 7 * 86400000)
      details.openPrs = { status: oldPrs.length > 3 ? 'warn' : 'pass', value: `${prs.length} open · ${oldPrs.length} older than 7d` }
    } else {
      details.openPrs = { status: 'warn', value: `GitHub API: ${res.status}` }
    }
  } catch (e: any) {
    details.openPrs = { status: 'warn', value: e?.message ?? 'GitHub API unreachable' }
  }

  // Latest commit
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const commits: any[] = await res.json()
      const sha = commits[0]?.sha?.slice(0, 7) ?? 'unknown'
      const date = commits[0]?.commit?.author?.date ?? 'unknown'
      details.lastCommit = { status: 'pass', value: `${sha} · ${date.slice(0, 10)}` }
    } else {
      details.lastCommit = { status: 'warn', value: `GitHub API: ${res.status}` }
    }
  } catch (e: any) {
    details.lastCommit = { status: 'warn', value: e?.message ?? 'Status check failed' }
  }

  const fails = Object.values(details).filter(d => d.status === 'fail').length
  const warns = Object.values(details).filter(d => d.status === 'warn').length
  return { status: fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass', details }
}
