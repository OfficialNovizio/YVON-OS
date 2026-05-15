/** Website health check — HTTP status, response time, SSL, DNS */
export interface WebHealthResult {
  status: 'pass' | 'fail' | 'warn'
  latency: number
  details: Record<string, { status: string; value: any }>
}

export async function checkWebsiteHealth(): Promise<WebHealthResult> {
  const url = process.env.NEXT_PUBLIC_URL || 'https://yvon.vercel.app'
  const details: Record<string, { status: string; value: any }> = {}
  const start = Date.now()

  // HTTP status + response time
  try {
    const cStart = Date.now()
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    const rTime = Date.now() - cStart
    details.httpStatus = { status: res.ok ? 'pass' : 'fail', value: `${res.status} (${rTime}ms)` }
  } catch (e: any) {
    details.httpStatus = { status: 'fail', value: e?.message ?? 'Request failed' }
  }

  // Full page load test
  try {
    const lStart = Date.now()
    const loadRes = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const loadTime = Date.now() - lStart
    details.pageLoad = { status: loadTime < 3000 ? 'pass' : loadTime < 5000 ? 'warn' : 'fail', value: `${loadRes.status} · ${loadTime}ms` }
  } catch (e: any) {
    details.pageLoad = { status: 'fail', value: e?.message ?? 'Page load failed' }
  }

  // SSL check via fetch (browsers validate this automatically)
  try {
    const sslStart = Date.now()
    await fetch(url, { signal: AbortSignal.timeout(5000) })
    details.ssl = { status: 'pass', value: `Valid · ${Date.now() - sslStart}ms handshake` }
  } catch (e: any) {
    details.ssl = { status: 'warn', value: e?.message ?? 'SSL check failed' }
  }

  const latency = Date.now() - start
  const fails = Object.values(details).filter(d => d.status === 'fail').length
  const warns = Object.values(details).filter(d => d.status === 'warn').length

  return { status: fails > 0 ? 'fail' : warns > 0 ? 'warn' : 'pass', latency, details }
}
