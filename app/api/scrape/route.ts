import { runWebScraper } from '@/lib/apify'
import { sanitizeForPrompt } from '@/lib/sanitize'

export const maxDuration = 30

export async function POST(request: Request): Promise<Response> {
  if (!process.env.APIFY_TOKEN) {
    return Response.json({ error: 'APIFY_TOKEN not set' }, { status: 500 })
  }

  let url: string
  try {
    const body = await request.json() as { url?: string }
    url = body.url ?? ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!url) {
    return Response.json({ error: 'url is required' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return Response.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    return Response.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
  }

  const host = parsed.hostname.toLowerCase()
  const PRIVATE_PREFIXES = ['localhost', '127.', '0.0.0.0', '10.', '169.254.', '192.168.']
  const PRIVATE_PATTERNS = [/^172\.(1[6-9]|2\d|3[01])\./, /^::1$/, /^fc[0-9a-f]{2}:/, /^fe[89ab][0-9a-f]:/i]
  if (
    PRIVATE_PREFIXES.some(p => host === p.replace(/\.$/, '') || host.startsWith(p)) ||
    PRIVATE_PATTERNS.some(r => r.test(host))
  ) {
    return Response.json({ error: 'URL not allowed' }, { status: 400 })
  }

  try {
    const raw  = await runWebScraper(url)
    const text = sanitizeForPrompt(raw)
    return Response.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
