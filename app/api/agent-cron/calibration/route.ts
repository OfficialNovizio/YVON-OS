import { NextRequest } from 'next/server'
import { getSecret } from '@/lib/secrets'
import { callFast } from '@/lib/ai-client'
import { getStrategyLog, getLeverTracker, runSkillLifecycleTransitions } from '@/lib/db'

export const maxDuration = 60

// Kahneman weekly calibration — runs every Friday 08:00 via Vercel cron
// Reads strategy_log + lever_tracker, detects calibration drift, saves report to DB
// Output is appended to the Monday Marcus CEO brief

export async function GET(request: NextRequest): Promise<Response> {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== await getSecret('CRON_SECRET')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ventures = ['Novizio', 'Hourbour']
    const surfaces = ['instagram', 'website', 'email', 'ads', 'linkedin']
    const reports: string[] = []

    for (const brand of ventures) {
      // Load last 10 strategy log entries (mix of pending and complete)
      const log = await getStrategyLog(brand, undefined, 10)
      // Load lever tracker for all surfaces
      const trackerRows = await Promise.all(
        surfaces.map(s => getLeverTracker(brand, s))
      )
      const cappedSurfaces = trackerRows
        .filter(r => r?.capped)
        .map(r => `${r!.surface} (${r!.lever} — ${r!.usageCount}/3 uses)`)

      // Build Kahneman calibration summary via Haiku
      const completedEntries = log.filter(e => e.result && e.result !== 'PENDING')
      const pendingEntries   = log.filter(e => !e.result || e.result === 'PENDING')

      const contextText = [
        `Brand: ${brand}`,
        `Completed entries: ${completedEntries.length}`,
        `Pending results: ${pendingEntries.length}`,
        `Capped levers: ${cappedSurfaces.length > 0 ? cappedSurfaces.join(', ') : 'none'}`,
        completedEntries.length > 0
          ? `Recent results:\n${completedEntries.slice(0, 5).map(e =>
              `  - ${e.surface} / ${e.lever}: ${e.result} (L${e.layerNumber}) — ${e.diagnosis ?? 'no diagnosis'}`
            ).join('\n')}`
          : 'No completed results yet.',
      ].join('\n')

      const report = await callFast({
        messages: [{
          role: 'user',
          content: `You are Kahneman, YVON Behavioral Economist. Weekly calibration audit for ${brand}.

${contextText}

Produce a concise calibration report (150 words max):
1. Calibration health: are predictions matching outcomes? Where is drift?
2. Capped levers requiring immediate rotation
3. Pending entries that most need results filled in
4. One specific recommendation for next week's content strategy

State explicitly: "The one thing I don't know here is..." before your recommendation.`,
        }],
        maxTokens: 400,
      }).catch(() => '')
      reports.push(`## ${brand} — Kahneman Calibration\n${report}`)
    }

    const fullReport = [
      `# Kahneman Weekly Calibration — ${new Date().toISOString().slice(0, 10)}`,
      ...reports,
      `\n_Delivered by Kahneman cron — appended to Monday Marcus brief_`,
    ].join('\n\n')

    // Phase F: run skill lifecycle transitions (active→stale→archived)
    const { staled, archived } = await runSkillLifecycleTransitions()

    return Response.json({ ok: true, report: fullReport, skillTransitions: { staled, archived } })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
