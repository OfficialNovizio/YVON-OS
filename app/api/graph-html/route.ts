// ── GET /api/graph-html ───────────────────────────────────────────────────────
// Serves .toon/graphs/graph.html directly from disk so the Next.js app can
// render the interactive graph without copying files to /public.

import { promises as fs } from 'fs'
import path from 'path'

export async function GET(): Promise<Response> {
  try {
    const htmlPath = path.join(process.cwd(), '.toon/graphs', 'graph.html')
    const html = await fs.readFile(htmlPath, 'utf-8')
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response('<h1>Graph not found — run <code>npm run graphify:build</code></h1>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
