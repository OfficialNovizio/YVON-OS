// Crisis Early Warning — monitors brand mentions + sentiment spikes
// GET: returns active crisis alerts
// POST: scans for new crises

import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { data } = await supabase
    .from('crisis_alerts')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return Response.json({ alerts: data ?? [], count: data?.length ?? 0 })
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: { brandName?: string; mentions?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const brandName = body.mentions ?? 'this brand'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a crisis early warning system. Scan these brand mentions and identify any potential PR crises, negative sentiment spikes, or customer complaints going viral.

Brand: ${body.brandName ?? brandName}

Analyze for:
1. Negative sentiment patterns (multiple complaints, recurring issues)
2. Viral complaints (single complaint with high engagement)
3. Misinformation spreading about the brand
4. PR crisis signals (media attention, competitor attacks)

For each alert found, return:
{
  "alertType": "negative_sentiment/brand_attack/customer_complaint_viral/misinformation/pr_crisis",
  "severity": "low/medium/high/critical",
  "message": "what's happening and why it matters",
  "urgency": "immediate/monitor/respond_within_24h"
}

Return ONLY a JSON array. If nothing concerning found, return [].`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const alerts = JSON.parse(raw) as Array<{ alertType: string; severity: string; message: string; urgency: string }>

    for (const a of alerts) {
      await supabase.from('crisis_alerts').insert({
        venture_id: ventureId,
        alert_type: a.alertType,
        severity: a.severity,
        message: a.message,
        trigger_data: { brandName: body.brandName, urgency: a.urgency },
        status: 'active',
      })
    }

    return Response.json({ scanned: true, alertsFound: alerts.length, alerts })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}