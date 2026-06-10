/**
 * /api/kai-report
 * Generates or retrieves Kai intelligence reports.
 * Only returns real data from Supabase kai_reports table.
 * No fabricated reports. If no real data exists, returns an error.
 *
 * POST { venture, period }
 * GET  ?venture=novizio
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: { venture?: string; period?: string }
  try {
    body = await req.json() as { venture?: string; period?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const venture = body.venture
  const period = body.period ?? '30D'

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture' }, { status: 400 })
  }

  // Check if the venture has any social snapshots to base a report on
  const { count } = await supabase
    .from('social_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('venture_slug', venture)
    .gt('cache_expires_at', new Date().toISOString())

  if (!count || count === 0) {
    return NextResponse.json({
      error: 'no_data',
      message: 'No social data available to generate a report. Connect social accounts and fetch data first.',
    }, { status: 400 })
  }

  // Spawn Kai via Hermes Agent to generate the report
  const ventureName = venture === 'hourbour' ? 'Hourbour' : 'Novizio'
  const isFashion = venture !== 'hourbour'

  // Gather data context for Kai
  let dataContext = ''
  try {
    const { data: snapshots } = await supabase
      .from('social_snapshots')
      .select('*')
      .eq('venture_slug', venture)
      .order('captured_at', { ascending: false })
      .limit(5)

    const { data: posts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('venture_slug', venture)
      .order('published_at', { ascending: false })
      .limit(10)

    dataContext = JSON.stringify({
      venture: ventureName,
      industry: isFashion ? 'Fashion DTC' : 'Fintech SaaS',
      period,
      snapshots: (snapshots ?? []).map((s: any) => ({
        platform: s.platform, followers: s.followers, engagement_rate: s.engagement_rate,
      })),
      recentPosts: (posts ?? []).map((p: any) => ({
        platform: p.platform, type: p.post_type, likes: p.likes, views: p.views, engagement_rate: p.engagement_rate,
      })),
    }, null, 2)
  } catch {
    dataContext = `Venture: ${ventureName}. Snapshots: ${count}. Full data unavailable.`
  }

  const metricsFocus = isFashion
    ? 'Instagram engagement, follower growth, Reels vs static, content virality, ROAS'
    : 'LinkedIn engagement, app retention, churn signals, trial-to-paid, MRR, LTV:CAC'

  const prompt = [
    `You are Kai, lead analyst for ${ventureName} (${isFashion ? 'fashion DTC e-commerce' : 'fintech SaaS'}).`,
    `Produce a full intelligence report for the ${period} period.`,
    `Key metrics: ${metricsFocus}`,
    ``,
    `Data context:`,
    dataContext,
    ``,
    `Return ONLY JSON in this format:`,
    `{"summary":"1-2 sentence executive summary","situation":{"title":"Situation","body":"what the data shows"},"diagnosis":{"title":"Diagnosis","body":"why the numbers moved — root causes"},"action":{"title":"Action","body":"3-4 numbered actions"},"prescription":{"title":"Kai Prescription","body":"single highest-leverage action this week"},"keyMetrics":[{"label":"Metric","value":"3.8x","delta":"+0.4x","positive":true}]}`,
    `Rules: no fabrication. If data is sparse, state what's missing. Max 4 keyMetrics. Use Nate Silver persona: signal vs noise, confidence levels.`,
  ].join('\n')

  try {
    const { spawn } = await import('child_process')
    const hermes = spawn('hermes', [
      '--profile', 'yvon', '-s', 'kai-analyst', 'chat', '-q', prompt,
    ], { timeout: 120_000, env: { ...process.env, HERMES_NO_COLOR: '1' } })

    let stdout = ''
    hermes.stdout.on('data', (c: Buffer) => { stdout += c.toString() })
    hermes.stderr.on('data', () => {})

    await new Promise<void>((resolve, reject) => {
      hermes.on('close', (code) => code === 0 ? resolve() : reject(new Error(`exit ${code}`)))
      hermes.on('error', reject)
    })

    // Parse the JSON from Kai's output
    const jsonMatch = stdout.match(/\{[\s\S]*"summary"[\s\S]*"prescription"[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        error: 'parse_failed',
        message: 'Kai agent ran but output could not be parsed.',
      }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const reportId = `kai-${Date.now()}`
    const now = new Date().toISOString()

    const report = {
      id: reportId,
      generatedAt: now,
      venture: ventureName,
      period,
      summary: parsed.summary ?? 'Analysis complete.',
      situation: parsed.situation ?? { title: 'Situation', body: '—' },
      diagnosis: parsed.diagnosis ?? { title: 'Diagnosis', body: '—' },
      action: parsed.action ?? { title: 'Action', body: '—' },
      prescription: parsed.prescription ?? { title: 'Kai Prescription', body: '—' },
      keyMetrics: parsed.keyMetrics ?? [],
    }

    // Persist to Supabase
    try {
      await supabase.from('kai_reports').insert({
        id: reportId,
        venture_slug: venture,
        venture_name: ventureName,
        period,
        generated_at: now,
        summary: report.summary,
        situation_title: report.situation.title,
        situation_body: report.situation.body,
        diagnosis_title: report.diagnosis.title,
        diagnosis_body: report.diagnosis.body,
        action_title: report.action.title,
        action_body: report.action.body,
        prescription_title: report.prescription.title,
        prescription_body: report.prescription.body,
        key_metrics: report.keyMetrics,
      })
    } catch (dbErr) {
      console.error('Failed to persist Kai report:', dbErr)
    }

    return NextResponse.json({ report })
  } catch (err) {
    console.error('Kai agent spawn failed:', err)
    return NextResponse.json({
      error: 'agent_failed',
      message: 'Kai agent could not be spawned. Check Hermes installation.',
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const venture = req.nextUrl.searchParams.get('venture')

  if (!venture) {
    return NextResponse.json({ error: 'Missing venture' }, { status: 400 })
  }

  try {
    const { data } = await supabase
      .from('kai_reports')
      .select('*')
      .eq('venture_slug', venture)
      .order('generated_at', { ascending: false })
      .limit(10)

    const reports = (data ?? []).map(r => ({
      id: r.id,
      generatedAt: r.generated_at,
      venture: r.venture_name,
      period: r.period,
      summary: r.summary,
      situation: { title: r.situation_title, body: r.situation_body },
      diagnosis: { title: r.diagnosis_title, body: r.diagnosis_body },
      action: { title: r.action_title, body: r.action_body },
      prescription: { title: r.prescription_title, body: r.prescription_body },
      keyMetrics: r.key_metrics ?? [],
    }))

    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
