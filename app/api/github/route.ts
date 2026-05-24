import { getVentureBySlug, getAllVentures } from '@/lib/db'
import { getRequiredSecret, getSecret } from '@/lib/secrets'

const GH_API = 'https://api.github.com'

async function ghHeaders() {
  const token = await getRequiredSecret('GITHUB_TOKEN')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'YVON-OS/1.0',
  }
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    const [, owner, repo] = u.pathname.split('/')
    if (!owner || !repo) return null
    return { owner, repo: repo.replace(/\.git$/, '') }
  } catch {
    return null
  }
}

async function gh(path: string, opts?: RequestInit) {
  const base = await ghHeaders()
  const res = await fetch(`${GH_API}${path}`, { ...opts, headers: { ...base, ...(opts?.headers as Record<string, string> ?? {}) } })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub ${res.status}: ${body}`)
  }
  return res.json()
}

// ─── GET — read operations ─────────────────────────────────────────────────────

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const ventureSlug = searchParams.get('venture')
  const action      = searchParams.get('action') ?? 'repo'
  const filePath    = searchParams.get('path') ?? ''

  if (!ventureSlug) return Response.json({ error: 'venture param required' }, { status: 400 })
  if (!(await getSecret('GITHUB_TOKEN'))) return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 })

  const venture = await getVentureBySlug(ventureSlug)
  if (!venture)     return Response.json({ error: 'Venture not found' }, { status: 404 })
  if (!venture.repoUrl) return Response.json({ error: 'No GitHub repo URL set on this venture' }, { status: 400 })

  const parsed = parseRepoUrl(venture.repoUrl)
  if (!parsed) return Response.json({ error: 'Invalid GitHub repo URL format' }, { status: 400 })

  const { owner, repo } = parsed

  try {
    switch (action) {
      case 'repo': {
        const data = await gh(`/repos/${owner}/${repo}`)
        return Response.json({
          name:        data.name,
          fullName:    data.full_name,
          description: data.description,
          private:     data.private,
          defaultBranch: data.default_branch,
          stars:       data.stargazers_count,
          openIssues:  data.open_issues_count,
          url:         data.html_url,
          updatedAt:   data.updated_at,
        })
      }

      case 'tree': {
        const branch = searchParams.get('branch') ?? 'main'
        const data = await gh(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
        const files = (data.tree as Array<{ path: string; type: string; size?: number }>)
          .filter(f => f.type === 'blob')
          .map(f => ({ path: f.path, size: f.size ?? 0 }))
        return Response.json({ files, truncated: data.truncated })
      }

      case 'file': {
        if (!filePath) return Response.json({ error: 'path param required' }, { status: 400 })
        const data = await gh(`/repos/${owner}/${repo}/contents/${filePath}`)
        const content = Buffer.from(data.content as string, 'base64').toString('utf-8')
        return Response.json({ path: data.path, content, sha: data.sha, size: data.size, url: data.html_url })
      }

      case 'issues': {
        const state = searchParams.get('state') ?? 'open'
        const data = await gh(`/repos/${owner}/${repo}/issues?state=${state}&per_page=30&pulls=false`)
        const issues = (data as Array<{ id: number; number: number; title: string; state: string; created_at: string; html_url: string; labels: Array<{ name: string }> }>)
          .filter(i => !('pull_request' in i))
          .map(i => ({
            number:    i.number,
            title:     i.title,
            state:     i.state,
            labels:    i.labels.map(l => l.name),
            createdAt: i.created_at,
            url:       i.html_url,
          }))
        return Response.json({ issues })
      }

      case 'prs': {
        const state = searchParams.get('state') ?? 'open'
        const data = await gh(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`)
        const prs = (data as Array<{ number: number; title: string; state: string; created_at: string; html_url: string; head: { ref: string }; base: { ref: string } }>)
          .map(p => ({
            number:    p.number,
            title:     p.title,
            state:     p.state,
            head:      p.head.ref,
            base:      p.base.ref,
            createdAt: p.created_at,
            url:       p.html_url,
          }))
        return Response.json({ prs })
      }

      case 'branches': {
        const data = await gh(`/repos/${owner}/${repo}/branches?per_page=30`)
        const branches = (data as Array<{ name: string; protected: boolean }>).map(b => ({ name: b.name, protected: b.protected }))
        return Response.json({ branches })
      }

      case 'commits': {
        const data = await gh(`/repos/${owner}/${repo}/commits?per_page=20`)
        const commits = (data as Array<{ sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string }>)
          .map(c => ({
            sha:     c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            author:  c.commit.author.name,
            date:    c.commit.author.date,
            url:     c.html_url,
          }))
        return Response.json({ commits })
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// ─── POST — write operations ───────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  if (!(await getSecret('GITHUB_TOKEN'))) return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 })

  const body = await request.json() as {
    venture: string
    action: string
    title?: string
    bodyText?: string
    labels?: string[]
    head?: string
    base?: string
    filePath?: string
    fileContent?: string
    commitMessage?: string
    sha?: string
  }

  const { venture: ventureSlug, action } = body
  if (!ventureSlug || !action) return Response.json({ error: 'venture and action required' }, { status: 400 })

  const venture = await getVentureBySlug(ventureSlug)
  if (!venture)     return Response.json({ error: 'Venture not found' }, { status: 404 })
  if (!venture.repoUrl) return Response.json({ error: 'No GitHub repo URL set on this venture' }, { status: 400 })

  const parsed = parseRepoUrl(venture.repoUrl)
  if (!parsed) return Response.json({ error: 'Invalid GitHub repo URL format' }, { status: 400 })

  const { owner, repo } = parsed

  try {
    switch (action) {
      case 'create-issue': {
        const { title, bodyText, labels } = body
        if (!title) return Response.json({ error: 'title required' }, { status: 400 })
        const data = await gh(`/repos/${owner}/${repo}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: bodyText ?? '', labels: labels ?? [] }),
        })
        return Response.json({ number: data.number, url: data.html_url, title: data.title }, { status: 201 })
      }

      case 'create-pr': {
        const { title, bodyText, head, base } = body
        if (!title || !head) return Response.json({ error: 'title and head branch required' }, { status: 400 })
        const data = await gh(`/repos/${owner}/${repo}/pulls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: bodyText ?? '', head, base: base ?? 'main' }),
        })
        return Response.json({ number: data.number, url: data.html_url, title: data.title }, { status: 201 })
      }

      case 'update-file': {
        const { filePath, fileContent, commitMessage, sha } = body
        if (!filePath || !fileContent || !commitMessage) {
          return Response.json({ error: 'filePath, fileContent, commitMessage required' }, { status: 400 })
        }
        const content = Buffer.from(fileContent).toString('base64')
        const data = await gh(`/repos/${owner}/${repo}/contents/${filePath}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: commitMessage, content, sha }),
        })
        return Response.json({ commit: data.commit?.sha, url: data.content?.html_url })
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
