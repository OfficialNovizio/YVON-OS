import 'server-only'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import type { AnalyticsReport, TopPage } from '@/lib/types'

export async function getAnalyticsReport(propertyId?: string): Promise<AnalyticsReport> {
  const saJson = process.env.GOOGLE_SA_JSON
  const resolvedId = propertyId || process.env.GA4_PROPERTY_ID
  if (!saJson || !resolvedId) {
    throw new Error('GOOGLE_SA_JSON and GA4_PROPERTY_ID must be set')
  }

  const credentials = JSON.parse(saJson) as Record<string, string>
  const client = new BetaAnalyticsDataClient({ credentials })

  const [response] = await client.runReport({
    property: `properties/${resolvedId}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
    dimensions: [{ name: 'pagePath' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  })

  const rows = response.rows ?? []

  let sessions = 0
  let pageviews = 0
  let bounceRate = 0
  const topPages: TopPage[] = []

  rows.forEach((row, idx) => {
    const path = row.dimensionValues?.[0]?.value ?? '/'
    const views = parseInt(row.metricValues?.[1]?.value ?? '0', 10)
    topPages.push({ path, views })

    // Aggregate totals from first row (GA4 returns per-dimension rows)
    if (idx === 0) {
      sessions    = parseInt(row.metricValues?.[0]?.value ?? '0', 10)
      pageviews   = parseInt(row.metricValues?.[1]?.value ?? '0', 10)
      bounceRate  = parseFloat(row.metricValues?.[2]?.value ?? '0')
    }
  })

  return {
    sessions,
    pageviews,
    bounceRate,
    topPages,
    period: '30d',
    lastFetched: new Date().toISOString(),
  }
}
