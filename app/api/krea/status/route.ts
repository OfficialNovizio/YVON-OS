// Krea.ai Job Status — poll a generation job until completion
// GET /api/krea/status?jobId=xxx
// Returns: { status: 'pending' | 'completed' | 'failed', imageUrl?: string }

const KREA_BASE = 'https://api.krea.ai'

type KreaJob = {
  status: string
  completed_at?: string | null
  result?: {
    urls?: string[]
  }
}

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.KREA_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'KREA_API_KEY is not configured', status: 'failed' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) {
    return Response.json({ error: 'Missing jobId query parameter', status: 'failed' }, { status: 400 })
  }

  try {
    const res = await fetch(`${KREA_BASE}/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      const errText = await res.text()
      return Response.json(
        { error: `Krea API returned ${res.status}: ${errText}`, status: 'failed' },
        { status: 502 }
      )
    }

    const job = await res.json() as KreaJob

    // Job is complete when completed_at is set
    if (job.completed_at) {
      if (job.status === 'completed' && job.result?.urls?.[0]) {
        return Response.json({ status: 'completed', imageUrl: job.result.urls[0] })
      }
      // completed_at set but status isn't 'completed' — treat as failed
      return Response.json({ status: 'failed' })
    }

    // Still running
    return Response.json({ status: job.status ?? 'pending' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, status: 'failed' }, { status: 502 })
  }
}
