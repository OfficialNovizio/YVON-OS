import 'server-only'
import type { PostHogSession } from '@/lib/types'

const PH_BASE = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com'
const PH_KEY = process.env.POSTHOG_API_KEY ?? ''

export async function getPostHogSessions(
  ventureId: string,
  limit = 100
): Promise<PostHogSession[]> {
  if (!PH_KEY) return []

  const url = `${PH_BASE}/api/projects/@current/events?token=${PH_KEY}&limit=${limit}&event=session`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${PH_KEY}` },
  })
  if (!res.ok) throw new Error(`PostHog API: ${res.status}`)

  const data = (await res.json()) as { results?: Array<{ session_id?: string; distinct_id?: string; properties?: Record<string, unknown> }> }
  return (data.results ?? []).map((ev) => ({
    ventureId,
    sessionId: ev.session_id ?? '',
    distinctId: ev.distinct_id ?? '',
    utmSource: ((ev.properties ?? {}) as Record<string, unknown>).utm_source as string ?? '',
    utmMedium: ((ev.properties ?? {}) as Record<string, unknown>).utm_medium as string ?? '',
    utmCampaign: ((ev.properties ?? {}) as Record<string, unknown>).utm_campaign as string ?? '',
    utmContent: ((ev.properties ?? {}) as Record<string, unknown>).utm_content as string ?? '',
    utmTerm: ((ev.properties ?? {}) as Record<string, unknown>).utm_term as string ?? '',
    referrer: ((ev.properties ?? {}) as Record<string, unknown>).$referrer as string ?? '',
    deviceType: ((ev.properties ?? {}) as Record<string, unknown>).$device_type as string ?? '',
    browser: ((ev.properties ?? {}) as Record<string, unknown>).$browser as string ?? '',
    country: ((ev.properties ?? {}) as Record<string, unknown>).$geoip_country_code as string ?? '',
    pagesViewed: 1,
    converted: false,
  }))
}

export async function getPostHogFunnel(
  propertyId: string,
  funnelSteps: { eventName: string; eventPropertyFilters?: Record<string, unknown> }[]
): Promise<Array<{ count: number; order: number }>> {
  if (!PH_KEY) return []

  const url = `${PH_BASE}/api/projects/@current/insights/funnel/?token=${PH_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PH_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      series: funnelSteps.map((step) => ({
        event: step.eventName,
        properties: step.eventPropertyFilters ?? [],
      })),
    }),
  })
  if (!res.ok) throw new Error(`PostHog funnel: ${res.status}`)
  return (await res.json()) as Array<{ count: number; order: number }>
}
