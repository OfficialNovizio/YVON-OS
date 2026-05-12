// POST /api/github/pr-from-session
// Parses code blocks from a War Room synthesis, creates a branch,
// commits each file, and opens a draft PR. Agents write code — this ships it.

import { getVentureBySlug } from '@/lib/db'

const GH_API = 'https://api.github.com'

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept:        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent':  'YVON-OS/1.0',
    'Content-Type': 'application/json',
  }
}

function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    const [, owner, repo] = u.pathname.split('/')
    if (!owner || !repo) return null
    return { owner, repo: repo.replace(/\.git$/, '') }
  } catch { return null }
}

async function gh<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...opts,
    headers: { ...ghHeaders(), ...(opts?.headers as Record<string, string> ?? {}) },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GitHub ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ─── Parse code blocks ────────────────────────────────────────────────────────
// Looks for fenced code blocks with a file path on the first line:
//   ```typescript
//   // app/api/cart/route.ts   ← path extracted from here
//   export async function POST...
//   ```
// OR a path comment above the block:
//   // app/api/cart/route.ts
//   ```typescript
//   ...
//   ```

interface ParsedFile {
  path: string
  content: string
  language: string
}

function parseCodeBlocks(text: string): ParsedFile[] {
  const files: ParsedFile[] = []
  const seen = new Set<string>()

  // Pattern: fenced block where first line is a path comment
  const fencedRe = /```(\w+)?\n((?:\/\/|#)\s*([\w./\-]+\.\w+)\n)([\s\S]*?)```/g
  let m: RegExpExecArray | null

  while ((m = fencedRe.exec(text)) !== null) {
    const language = m[1] ?? 'text'
    const filePath  = m[3]?.trim()
    const body      = m[4]?.trim()

    if (!filePath || !body || seen.has(filePath)) continue
    // Skip very short blocks (likely inline examples, not real files)
    if (body.split('\n').length < 3) continue

    seen.add(filePath)
    files.push({ path: filePath, content: body, language })
  }

  // Pattern: path comment immediately before a fenced block
  const preFencedRe = /(?:\/\/|#)\s*([\w./\-]+\.\w+)\n```(\w+)?\n([\s\S]*?)```/g
  while ((m = preFencedRe.exec(text)) !== null) {
    const filePath  = m[1]?.trim()
    const language  = m[2] ?? 'text'
    const body      = m[3]?.trim()

    if (!filePath || !body || seen.has(filePath)) continue
    if (body.split('\n').length < 3) continue

    seen.add(filePath)
    files.push({ path: filePath, content: body, language })
  }

  return files
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  if (!process.env.GITHUB_TOKEN) {
    return Response.json({ error: 'GITHUB_TOKEN not configured' }, { status: 503 })
  }

  const body = await request.json() as {
    venture:   string   // slug
    synthesis: string   // full Marcus synthesis text to parse code from
    sessionSummary?: string  // short description for PR title
    agents?: string[]   // which agents contributed
  }

  const { venture: ventureSlug, synthesis, sessionSummary, agents = [] } = body
  if (!ventureSlug || !synthesis) {
    return Response.json({ error: 'venture and synthesis are required' }, { status: 400 })
  }

  const venture = await getVentureBySlug(ventureSlug)
  if (!venture)        return Response.json({ error: 'Venture not found' }, { status: 404 })
  if (!venture.repoUrl) return Response.json({ error: 'No GitHub repo linked to this venture' }, { status: 400 })

  const parsed = parseRepoUrl(venture.repoUrl)
  if (!parsed) return Response.json({ error: 'Invalid repo URL' }, { status: 400 })

  const { owner, repo } = parsed

  // Parse code blocks from synthesis
  const files = parseCodeBlocks(synthesis)
  if (files.length === 0) {
    return Response.json({
      ok: false,
      reason: 'no-code-blocks',
      message: 'No file paths found in the session output. Agents need to prefix code blocks with a comment like `// path/to/file.ts`.',
    })
  }

  try {
    // Get default branch + its SHA
    const repoInfo = await gh<{ default_branch: string }>(`/repos/${owner}/${repo}`)
    const defaultBranch = repoInfo.default_branch

    const branchInfo = await gh<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`)
    const baseSha = branchInfo.object.sha

    // Create a new branch: yvon/2026-05-10-a3b2
    const shortHash = Math.random().toString(36).slice(2, 6)
    const branchName = `yvon/${new Date().toISOString().slice(0, 10)}-${shortHash}`

    await gh(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
    })

    // Commit each file onto the new branch
    const committed: string[] = []
    for (const file of files) {
      try {
        // Check if file exists (need its sha for update)
        let existingSha: string | undefined
        try {
          const existing = await gh<{ sha: string }>(`/repos/${owner}/${repo}/contents/${file.path}?ref=${branchName}`)
          existingSha = existing.sha
        } catch { /* file doesn't exist yet — create */ }

        const content = Buffer.from(file.content + '\n').toString('base64')
        await gh(`/repos/${owner}/${repo}/contents/${file.path}`, {
          method: 'PUT',
          body: JSON.stringify({
            message: `yvon(${file.path.split('/').pop()}): AI-generated change from War Room session`,
            content,
            branch: branchName,
            ...(existingSha ? { sha: existingSha } : {}),
          }),
        })
        committed.push(file.path)
      } catch (err) {
        // Non-fatal — skip this file, continue with others
        console.error(`Failed to commit ${file.path}:`, err)
      }
    }

    if (committed.length === 0) {
      return Response.json({ ok: false, reason: 'commit-failed', message: 'All file commits failed. Check file paths are correct.' })
    }

    // Open a draft PR
    const agentList = agents.length > 0 ? agents.join(', ') : 'YVON agents'
    const prTitle   = sessionSummary
      ? `yvon: ${sessionSummary.slice(0, 60)}`
      : `yvon: War Room session — ${committed.length} file(s) changed`

    const prBody = [
      `## YVON War Room — Draft PR`,
      ``,
      `**Agents:** ${agentList}`,
      `**Files changed:** ${committed.length}`,
      ``,
      `### Files`,
      committed.map(f => `- \`${f}\``).join('\n'),
      ``,
      `### Session Summary`,
      sessionSummary ?? '_No summary provided_',
      ``,
      `---`,
      `> This PR was created automatically by YVON after a War Room session.`,
      `> Review all changes carefully before merging. The agents recommend — you decide.`,
    ].join('\n')

    const pr = await gh<{ number: number; html_url: string; title: string }>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title: prTitle,
        body:  prBody,
        head:  branchName,
        base:  defaultBranch,
        draft: true,
      }),
    })

    return Response.json({
      ok:        true,
      prNumber:  pr.number,
      prUrl:     pr.html_url,
      branch:    branchName,
      committed,
      skipped:   files.filter(f => !committed.includes(f.path)).map(f => f.path),
    }, { status: 201 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
