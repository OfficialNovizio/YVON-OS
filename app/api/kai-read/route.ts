/**
 * /api/kai-read
 * Spawns the Kai Hermes agent with current analytics data to produce a
 * 3-bullet intelligence card: what changed / why it matters / what to do.
 *
 * Uses the YVON Hermes profile with kai-analyst skill, passing venture
 * context and fresh data so Kai can produce a real analysis.
 *
 * POST { venture: 'novizio' | 'hourbour', context?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface KaiReadResponse {
  situation: string
  diagnosis: string
  action: string
  confidence: 'high' | 'medium' | 'low'
  generatedAt: string
  source: 'hermes-agent' | 'fallback'
}

function fallbackRead(venture: string): KaiReadResponse {
  const brand = venture === 'hourbour' ? 'Hourbour' : 'Novizio'
  return {
    situation: `${brand} analytics data is connected. Data flows from connected platforms into the system.`,
    diagnosis: `No Kai analysis has been run yet for this period. Social snapshots and post data exist — analysis is pending.`,
    action: `Run the Kai morning brief or click Generate on the Reports tab to populate real intelligence. This card updates automatically after each Kai run.`,
    confidence: 'low',
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  }
}

function parseKaiOutput(stdout: string): KaiReadResponse | null {
  const jsonMatch = stdout.match(/\{[\s\S]*"situation"[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (parsed.situation && parsed.diagnosis && parsed.action) {
      return {
        situation: parsed.situation,
        diagnosis: parsed.diagnosis,
        action: parsed.action,
        confidence: parsed.confidence || 'medium',
        generatedAt: new Date().toISOString(),
        source: 'hermes-agent',
      }
    }
  } catch { /* fall through */ }

  const lines = stdout.split('\n').filter(l => l.trim().length > 0)
  if (lines.length >= 3) {
    return {
      situation: lines[0].slice(0, 300),
      diagnosis: lines[1].slice(0, 300),
      action: lines[2].slice(0, 300),
      confidence: 'medium',
      generatedAt: new Date().toISOString(),
      source: 'hermes-agent',
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  let body: { venture?: string; context?: string }
  try {
    body = (await req.json()) as { venture?: string; context?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const venture = body.venture
  if (!venture) {
    return NextResponse.json({ error: 'Missing venture' }, { status: 400 })
  }

  const ventureName = venture === 'hourbour' ? 'Hourbour' : 'Novizio'
  const isFashion = venture !== 'hourbour'

  let dataContext = ''
  try {
    const { count: snapCount } = await supabase
      .from('social_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('venture_slug', venture)
      .gt('cache_expires_at', new Date().toISOString())

    const { count: postCount } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('venture_slug', venture)

    dataContext = [
      `Venture: ${ventureName}`,
      `Industry: ${isFashion ? 'Fashion DTC' : 'Fintech SaaS'}`,
      `Social snapshots: ${snapCount ?? 0}`,
      `Social posts: ${postCount ?? 0}`,
      body.context || '',
    ].filter(Boolean).join(' | ')
  } catch {
    dataContext = `Venture: ${ventureName}. Data fetch failed.`
  }

  const metricsFocus = isFashion
    ? 'Instagram engagement, follower growth, Reels performance, ROAS, content virality'
    : 'LinkedIn engagement, app sessions/user, retention, churn, trial-to-paid, MRR'

  const prompt = [
    `You are Kai, lead analyst for ${ventureName} (${isFashion ? 'fashion DTC' : 'fintech SaaS'}).`,
    `Produce a 3-part readout. Data: ${dataContext}`,
    `Focus: ${metricsFocus}`,
    ``,
    `Respond ONLY with JSON:`,
    `{"situation":"one sentence — what changed","diagnosis":"one sentence — why it matters","action":"one sentence — highest-leverage action","confidence":"high|medium|low"}`,
    `Never fabricate numbers. If data is sparse, say so and rate confidence low.`,
  ].join('\n')

  try {
    const hermes = spawn('hermes', [
      '--profile', 'yvon', '-s', 'kai-analyst', 'chat', '-q', prompt,
    ], { timeout: 90_000, env: { ...process.env, HERMES_NO_COLOR: '1' } })

    let stdout = ''
    hermes.stdout.on('data', (c: Buffer) => { stdout += c.toString() })
    hermes.stderr.on('data', () => {})

    await new Promise<void>((resolve, reject) => {
      hermes.on('close', (code) => code === 0 ? resolve() : reject(new Error(`exit ${code}`)))
      hermes.on('error', reject)
    })

    const parsed = parseKaiOutput(stdout)
    return NextResponse.json(parsed || { ...fallbackRead(venture), source: 'fallback' as const })
  } catch {
    return NextResponse.json(fallbackRead(venture))
  }
}
