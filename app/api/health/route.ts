/** GET /api/health — Consolidated health check. Runs all checks, writes alerts for failures. */
import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/health/database'
import { checkWebsiteHealth } from '@/lib/health/website'
import { checkSpend } from '@/lib/health/spend'
import { checkRepositoryHealth } from '@/lib/health/repository'
import { writeHealthAlert } from '@/lib/health/alerts'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function GET() {
  const [db, web, spend, repo] = await Promise.all([
    checkDatabaseHealth().catch(e => ({ status: 'fail' as const, latency: 0, details: { error: { status: 'fail', value: e.message } } })),
    checkWebsiteHealth().catch(e => ({ status: 'fail' as const, latency: 0, details: { error: { status: 'fail', value: e.message } } })),
    checkSpend().catch(e => ({ status: 'fail' as const, details: { error: { status: 'fail', value: e.message } }, totals: { monthToDate: 0, dailyBurn: 0, projectedMonth: 0 } })),
    checkRepositoryHealth().catch(e => ({ status: 'fail' as const, details: { error: { status: 'fail', value: e.message } } })),
  ])

  const overallStatus = [db.status, web.status, spend.status, repo.status].every(s => s === 'pass') ? 'pass' : 'fail'
  const timestamp = new Date().toISOString()

  // Write alert if any check failed
  if (overallStatus === 'fail') {
    const failed: string[] = []
    if (db.status !== 'pass') failed.push('database')
    if (web.status !== 'pass') failed.push('website')
    if (spend.status !== 'pass') failed.push('spend')
    if (repo.status !== 'pass') failed.push('repository')
    await writeHealthAlert({
      agent: 'dev-lead',
      type: 'alert',
      summary: `Health check failed: ${failed.join(', ')}`,
      severity: failed.length > 2 ? 'critical' : 'warning',
      data: { db: db.status, web: web.status, spend: spend.status, repo: repo.status, timestamp },
    })
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp,
    checks: {
      database: { status: db.status, latency: db.latency, details: db.details },
      website: { status: web.status, latency: web.latency, details: web.details },
      spend: { status: spend.status, details: spend.details, totals: spend.totals },
      repository: { status: repo.status, details: repo.details },
    },
  })
}
