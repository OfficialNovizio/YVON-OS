import { getSecret } from '@/lib/secrets'

// Krea.ai Image Generation — submit an async image generation job
// POST: sends prompt to Krea API, returns job_id for polling
// Docs: https://docs.krea.ai/api-reference/introduction

export const maxDuration = 30

const KREA_BASE = 'https://api.krea.ai'

type RequestBody = {
  prompt?: string
  model?: string
  width?: number
  height?: number
  steps?: number
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = await getSecret('KREA_API_KEY')
  if (!apiKey) {
    return Response.json({ error: 'KREA_API_KEY is not configured. Add it to your .env.local file.' }, { status: 500 })
  }

  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.prompt?.trim()) {
    return Response.json({ error: 'Missing prompt' }, { status: 400 })
  }

  // Default model is flux-1-dev (fastest, cheapest — ~4s, ~3 compute units)
  // Other options: bfl/flux-1-1-pro, bfl/flux-1-1-pro-ultra
  const model = body.model ?? 'bfl/flux-1-dev'
  const endpoint = `${KREA_BASE}/generate/image/${model}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: body.prompt,
        width: body.width ?? 1024,
        height: body.height ?? 1024,
        steps: body.steps ?? 28,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return Response.json(
        { error: `Krea API returned ${res.status}: ${errText}` },
        { status: 502 }
      )
    }

    const data = await res.json() as { job_id?: string }
    if (!data.job_id) {
      return Response.json({ error: 'Krea API did not return a job_id' }, { status: 502 })
    }

    return Response.json({ jobId: data.job_id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
