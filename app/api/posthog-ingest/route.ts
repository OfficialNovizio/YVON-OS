// POST /api/posthog-ingest - Ingests PostHog session data into Supabase
// Called server-side or via webhook from PostHog

import { NextRequest, NextResponse } from 'next/server'
import { upsertPostHogSession } from '@/lib/db-phase1'

export async function POST(req: NextRequest) {
  if (!process.env.POSTHOG_API_KEY) {
    return NextResponse.json({ error: 'POSTHOG_API_KEY not set' }, { status: 500 })
  }

  try {
    const body = await req.json() as Record<string, unknown>
    const ventureId = (body.ventureId as string) ?? 'novizio'

    // Accept either a single session or an array of sessions
    const sessions = Array.isArray(body.sessions)
      ? body.sessions
      : [body]

    for (const s of sessions) {
      const session = s as Record<string, unknown>
      await upsertPostHogSession({
        ventureId,
        sessionId: (session.sessionId as string) ?? '',
        distinctId: (session.distinctId as string) ?? undefined,
        utmSource: (session.utm_source as string) ?? (session.utmSource as string) ?? undefined,
        utmMedium: (session.utm_medium as string) ?? (session.utmMedium as string) ?? undefined,
        utmCampaign: (session.utm_campaign as string) ?? (session.utmCampaign as string) ?? undefined,
        utmContent: (session.utm_content as string) ?? (session.utmContent as string) ?? undefined,
        utmTerm: (session.utm_term as string) ?? (session.utmTerm as string) ?? undefined,
        referrer: (session.referrer as string) ?? undefined,
        deviceType: (session.device_type as string) ?? (session.deviceType as string) ?? undefined,
        browser: (session.browser as string) ?? undefined,
        country: (session.country as string) ?? undefined,
        pagesViewed: (session.pages_viewed as number) ?? (session.pagesViewed as number) ?? 1,
        sessionStart: (session.session_start as string) ?? (session.sessionStart as string) ?? undefined,
        sessionEnd: (session.session_end as string) ?? (session.sessionEnd as string) ?? undefined,
        converted: (session.converted as boolean) ?? false,
        conversionValue: (session.conversion_value as number) ?? (session.conversionValue as number) ?? undefined,
      })
    }

    return NextResponse.json({ ingested: sessions.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/posthog-ingest - Pulls latest sessions from PostHog API and writes to Supabase
export async function GET(req: NextRequest) {
  if (!process.env.POSTHOG_API_KEY) {
    return NextResponse.json({ error: 'POSTHOG_API_KEY not set' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const ventureId = searchParams.get('ventureId') ?? 'novizio'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

  const phHost = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'
  const phKey = process.env.POSTHOG_API_KEY

  const url = `${phHost}/api/projects/@current/sessions?token=${phKey}&limit=${limit}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${phKey}` },
  })
  if (!res.ok) {
    return NextResponse.json({ error: `PostHog API: ${res.status}` }, { status: 502 })
  }

  const data = (await res.json()) as { results?: Array<Record<string, unknown>> }
  const sessions = data.results ?? []

  for (const ev of sessions) {
    const props = ev.properties as Record<string, unknown> ?? {}
    await upsertPostHogSession({
      ventureId,
      sessionId: (ev.session_id as string) ?? '',
      distinctId: (ev.distinct_id as string) ?? undefined,
      utmSource: (props.utm_source as string) ?? '',
      utmMedium: (props.utm_medium as string) ?? '',
      utmCampaign: (props.utm_campaign as string) ?? '',
      utmContent: (props.utm_content as string) ?? '',
      utmTerm: (props.utm_term as string) ?? '',
      referrer: (props.referrer as string) ?? '',
      deviceType: (props.device_type as string) ?? '',
      browser: (props.browser as string) ?? '',
      country: (props.country as string) ?? '',
      pagesViewed: 1,
      converted: false,
    })
  }

  return NextResponse.json({ synced: sessions.length })
}
