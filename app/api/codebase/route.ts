// ── GET /api/codebase ──────────────────────────────────────────────────────────
// Handles file reading, git operations, and pending change management
// for external projects (Novizio, Hourbour).
//
// Query params:
//   action=list    &project=novizio&path=src        → list files/dirs
//   action=read    &project=novizio&file=src/index.ts → read file content
//   action=diff    &project=novizio                 → git diff (unstaged)
//   action=status  &project=novizio                 → git status
//   action=log     &project=novizio&count=10        → recent commits
//   action=pending &project=novizio                 → list pending_changes from Supabase
//
// POST body:
//   { action: 'propose', project, agentId, agentName, branchName, commitMessage, files[] }
//   { action: 'approve', id }   → git commit + push
//   { action: 'reject', id, note }

import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { getProject } from '@/lib/projects'

const execAsync = promisify(exec)

// ── Supabase helpers ──────────────────────────────────────────────────────────
function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  }
}

async function sbGet(path: string) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`
  const res = await fetch(url, { headers: supabaseHeaders() })
  if (!res.ok) return null
  return res.json()
}

async function sbPost(table: string, body: object) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  return res.json()
}

async function sbPatch(table: string, id: string, body: object) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  return res.json()
}

// ── Path safety ───────────────────────────────────────────────────────────────
// Prevent directory traversal — all accessed paths must resolve inside localPath
function safePath(localPath: string, subPath: string): string | null {
  const resolved = path.resolve(localPath, subPath)
  if (!resolved.startsWith(localPath)) return null
  return resolved
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const action    = searchParams.get('action') ?? 'status'
  const projectId = searchParams.get('project')

  if (!projectId) {
    return Response.json({ error: 'project param required' }, { status: 400 })
  }

  const project = getProject(projectId)
  if (!project) {
    return Response.json({ error: `Unknown project: ${projectId}` }, { status: 404 })
  }

  // ── action=pending — no localPath needed ──────────────────────────────────
  if (action === 'pending') {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ changes: [], hasSupabase: false })
    }
    const data = await sbGet(
      `pending_changes?project_id=eq.${projectId}&order=requested_at.desc&limit=50`
    )
    return Response.json({ changes: data ?? [], hasSupabase: true })
  }

  if (!project.localPath) {
    return Response.json({
      error: 'Project not mounted. Set env var NOVIZIO_PATH or HOURBOUR_PATH to the local repo path.',
      mounted: false,
    }, { status: 422 })
  }

  // ── action=list ───────────────────────────────────────────────────────────
  if (action === 'list') {
    const subPath = searchParams.get('path') ?? ''
    const target = safePath(project.localPath, subPath)
    if (!target) return Response.json({ error: 'Invalid path' }, { status: 400 })

    try {
      const entries = await fs.readdir(target, { withFileTypes: true })
      const items = entries
        .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.next')
        .map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file',
          path: subPath ? `${subPath}/${e.name}` : e.name,
        }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
          return a.name.localeCompare(b.name)
        })
      return Response.json({ items, path: subPath })
    } catch {
      return Response.json({ error: 'Could not read directory' }, { status: 500 })
    }
  }

  // ── action=read ───────────────────────────────────────────────────────────
  if (action === 'read') {
    const file = searchParams.get('file') ?? ''
    const target = safePath(project.localPath, file)
    if (!target) return Response.json({ error: 'Invalid path' }, { status: 400 })

    try {
      const content = await fs.readFile(target, 'utf-8')
      const lines   = content.split('\n').length
      return Response.json({ content, lines, file })
    } catch {
      return Response.json({ error: 'Could not read file' }, { status: 500 })
    }
  }

  // ── git actions — require git in localPath ────────────────────────────────
  const opts = { cwd: project.localPath }

  if (action === 'status') {
    try {
      const { stdout: statusOut } = await execAsync('git status --short', opts)
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', opts)
      const { stdout: aheadOut  } = await execAsync(
        'git rev-list --count @{u}..HEAD 2>/dev/null || echo 0', opts
      ).catch(() => ({ stdout: '0' }))
      return Response.json({
        branch: branchOut.trim(),
        status: statusOut.trim(),
        aheadBy: parseInt(aheadOut.trim()) || 0,
        mounted: true,
      })
    } catch {
      return Response.json({ error: 'git status failed — is this a git repo?' }, { status: 500 })
    }
  }

  if (action === 'diff') {
    try {
      const { stdout } = await execAsync('git diff HEAD', opts)
      return Response.json({ diff: stdout, mounted: true })
    } catch {
      return Response.json({ error: 'git diff failed' }, { status: 500 })
    }
  }

  if (action === 'log') {
    const count = parseInt(searchParams.get('count') ?? '10')
    try {
      const { stdout } = await execAsync(
        `git log --oneline --format="%H|%s|%an|%ar" -n ${count}`, opts
      )
      const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [hash, message, author, when] = line.split('|')
        return { hash: hash?.slice(0, 7), message, author, when }
      })
      return Response.json({ commits, mounted: true })
    } catch {
      return Response.json({ error: 'git log failed' }, { status: 500 })
    }
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action as string

  // ── propose — store proposed changes in Supabase ──────────────────────────
  if (action === 'propose') {
    const { project: projectId, agentId, agentName, branchName, commitMessage, files, diff } = body

    if (!projectId || !agentId || !commitMessage || !files) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: 'Supabase not configured' }, { status: 422 })
    }

    const result = await sbPost('pending_changes', {
      project_id:     projectId,
      agent_id:       agentId,
      agent_name:     agentName ?? agentId,
      branch_name:    branchName ?? `agent/${agentId}-${Date.now()}`,
      commit_message: commitMessage,
      files:          files,
      diff:           diff ?? null,
      status:         'pending',
    })

    if (!result) return Response.json({ error: 'Failed to store proposal' }, { status: 500 })
    return Response.json({ ok: true, id: result[0]?.id })
  }

  // ── approve — write files + git commit + push ─────────────────────────────
  if (action === 'approve') {
    const { id } = body
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: 'Supabase not configured' }, { status: 422 })
    }

    // Fetch the pending change
    const rows = await sbGet(`pending_changes?id=eq.${id}`)
    if (!rows || rows.length === 0) return Response.json({ error: 'Change not found' }, { status: 404 })
    const change = rows[0]

    const project = getProject(change.project_id)
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })
    if (!project.localPath) return Response.json({ error: 'Project not mounted' }, { status: 422 })

    const opts = { cwd: project.localPath }

    try {
      // Create/checkout branch
      const branch = change.branch_name
      await execAsync(`git checkout -b ${branch} 2>/dev/null || git checkout ${branch}`, opts)

      // Write each proposed file
      const files = change.files as Array<{ path: string; content: string }>
      for (const f of files) {
        const target = safePath(project.localPath, f.path)
        if (!target) continue
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, f.content, 'utf-8')
      }

      // Stage + commit
      await execAsync('git add -A', opts)
      await execAsync(
        `git commit -m "${change.commit_message.replace(/"/g, '\\"')}"`, opts
      )

      // Push branch
      await execAsync(`git push origin ${branch}`, opts)

      // Mark approved in Supabase
      await sbPatch('pending_changes', id as string, {
        status:      'approved',
        reviewed_at: new Date().toISOString(),
      })

      return Response.json({ ok: true, branch, message: 'Committed and pushed.' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return Response.json({ error: `Git operation failed: ${msg}` }, { status: 500 })
    }
  }

  // ── reject — mark as rejected in Supabase ────────────────────────────────
  if (action === 'reject') {
    const { id, note } = body
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return Response.json({ error: 'Supabase not configured' }, { status: 422 })
    }

    await sbPatch('pending_changes', id as string, {
      status:      'rejected',
      reviewed_at: new Date().toISOString(),
      review_note: note ?? '',
    })

    return Response.json({ ok: true })
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
