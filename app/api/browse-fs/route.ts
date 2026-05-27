/**
 * /api/browse-fs?path=/Users/...
 * Lists subdirectories at the given path on the local filesystem.
 * Used by the folder picker in Venture Settings → Profile.
 * Only available in local dev — returns 403 in production.
 */

import { NextRequest } from 'next/server'
import { readdirSync, statSync } from 'fs'
import { join, normalize } from 'path'
import { homedir } from 'os'

export async function GET(req: NextRequest) {
  // Guard: only allow in development or local environments
  if (process.env.VERCEL_ENV === 'production') {
    return Response.json({ error: 'Not available in production' }, { status: 403 })
  }

  const raw = new URL(req.url).searchParams.get('path') ?? homedir()
  // Prevent path traversal above root
  const safePath = normalize(raw).replace(/\0/g, '')

  try {
    const entries = readdirSync(safePath, { withFileTypes: true })
    const dirs = entries
      .filter(e => {
        if (!e.isDirectory()) return false
        // Skip hidden and system dirs
        if (e.name.startsWith('.')) return false
        if (['node_modules', '__pycache__', '.git'].includes(e.name)) return false
        try { statSync(join(safePath, e.name)); return true } catch { return false }
      })
      .map(e => ({ name: e.name, path: join(safePath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return Response.json({ path: safePath, dirs, home: homedir() })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
