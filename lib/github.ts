/**
 * lib/github.ts — GitHub REST helpers shared by /api/github and agent tools.
 * Read-only. Auth via GITHUB_TOKEN env. No write helpers exposed here on purpose
 * (writes stay in /api/github so they go through Next.js auth middleware).
 */

import { getVentureBySlug } from '@/lib/db'
import { getRequiredSecret } from '@/lib/secrets'

const GH_API = 'https://api.github.com'

async function headers(): Promise<Record<string, string>> {
  const token = await getRequiredSecret('GITHUB_TOKEN')
  return {
    Authorization:         `Bearer ${token}`,
    Accept:                'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent':          'YVON-OS/1.0',
  }
}

async function gh<T>(path: string, opts?: RequestInit): Promise<T> {
  const baseHeaders = await headers()
  const res = await fetch(`${GH_API}${path}`, { ...opts, headers: { ...baseHeaders, ...(opts?.headers as Record<string, string> ?? {}) } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 500)}`)
  }
  return res.json() as Promise<T>
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    const [, owner, repo] = u.pathname.split('/')
    if (!owner || !repo) return null
    return { owner, repo: repo.replace(/\.git$/, '') }
  } catch {
    return null
  }
}

/** Resolve a venture slug to its parsed repo coordinates. Throws on misconfig. */
export async function resolveVentureRepo(slug: string): Promise<{ owner: string; repo: string; repoUrl: string }> {
  // Token check happens lazily via getRequiredSecret() inside gh()
  const venture = await getVentureBySlug(slug)
  if (!venture) throw new Error(`Venture not found: ${slug}`)
  if (!venture.repoUrl) throw new Error(`No GitHub repo URL set on venture "${slug}". Configure in Settings → Venture → Profile.`)
  const parsed = parseRepoUrl(venture.repoUrl)
  if (!parsed) throw new Error(`Invalid GitHub repo URL: ${venture.repoUrl}`)
  return { ...parsed, repoUrl: venture.repoUrl }
}

// ─── Read operations ──────────────────────────────────────────────────────────

export interface RepoInfo {
  name:          string
  fullName:      string
  description:   string | null
  private:       boolean
  defaultBranch: string
  stars:         number
  openIssues:    number
  url:           string
  updatedAt:     string
}

export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const d = await gh<{ name: string; full_name: string; description: string | null; private: boolean; default_branch: string; stargazers_count: number; open_issues_count: number; html_url: string; updated_at: string }>(`/repos/${owner}/${repo}`)
  return {
    name:          d.name,
    fullName:      d.full_name,
    description:   d.description,
    private:       d.private,
    defaultBranch: d.default_branch,
    stars:         d.stargazers_count,
    openIssues:    d.open_issues_count,
    url:           d.html_url,
    updatedAt:     d.updated_at,
  }
}

export async function getRepoTree(owner: string, repo: string, branch = 'main'): Promise<{ files: Array<{ path: string; size: number }>; truncated: boolean }> {
  const d = await gh<{ tree: Array<{ path: string; type: string; size?: number }>; truncated: boolean }>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
  return {
    files: d.tree.filter(f => f.type === 'blob').map(f => ({ path: f.path, size: f.size ?? 0 })),
    truncated: d.truncated,
  }
}

export async function getRepoFile(owner: string, repo: string, path: string): Promise<{ path: string; content: string; sha: string; size: number; url: string }> {
  const d = await gh<{ path: string; content: string; sha: string; size: number; html_url: string }>(`/repos/${owner}/${repo}/contents/${path}`)
  return {
    path:    d.path,
    content: Buffer.from(d.content, 'base64').toString('utf-8'),
    sha:     d.sha,
    size:    d.size,
    url:     d.html_url,
  }
}

export async function listIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Array<{ number: number; title: string; state: string; labels: string[]; createdAt: string; url: string }>> {
  const d = await gh<Array<{ number: number; title: string; state: string; created_at: string; html_url: string; labels: Array<{ name: string }>; pull_request?: unknown }>>(`/repos/${owner}/${repo}/issues?state=${state}&per_page=30`)
  return d
    .filter(i => !i.pull_request)
    .map(i => ({
      number:    i.number,
      title:     i.title,
      state:     i.state,
      labels:    i.labels.map(l => l.name),
      createdAt: i.created_at,
      url:       i.html_url,
    }))
}

export async function listPRs(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Array<{ number: number; title: string; state: string; head: string; base: string; createdAt: string; url: string }>> {
  const d = await gh<Array<{ number: number; title: string; state: string; created_at: string; html_url: string; head: { ref: string }; base: { ref: string } }>>(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`)
  return d.map(p => ({
    number:    p.number,
    title:     p.title,
    state:     p.state,
    head:      p.head.ref,
    base:      p.base.ref,
    createdAt: p.created_at,
    url:       p.html_url,
  }))
}

export async function listBranches(owner: string, repo: string): Promise<Array<{ name: string; protected: boolean }>> {
  const d = await gh<Array<{ name: string; protected: boolean }>>(`/repos/${owner}/${repo}/branches?per_page=30`)
  return d.map(b => ({ name: b.name, protected: b.protected }))
}

export async function listCommits(owner: string, repo: string, limit = 20): Promise<Array<{ sha: string; message: string; author: string; date: string; url: string }>> {
  const d = await gh<Array<{ sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }>>(`/repos/${owner}/${repo}/commits?per_page=${limit}`)
  return d.map(c => ({
    sha:     c.sha.slice(0, 7),
    message: c.commit.message.split('\n')[0],
    author:  c.commit.author.name,
    date:    c.commit.author.date,
    url:     c.html_url,
  }))
}

export async function searchCode(owner: string, repo: string, query: string): Promise<Array<{ path: string; url: string }>> {
  const q = encodeURIComponent(`${query} repo:${owner}/${repo}`)
  const d = await gh<{ items: Array<{ path: string; html_url: string }> }>(`/search/code?q=${q}&per_page=20`)
  return d.items.map(i => ({ path: i.path, url: i.html_url }))
}
