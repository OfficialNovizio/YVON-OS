import { runWebScraper } from '@/lib/apify'

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

  try {
    new URL(url) // validate URL format
  } catch {
    return Response.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  try {
    const text = await runWebScraper(url)
    return Response.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
