// app/api/toongine/init/route.ts
// One-click initialization: TOON compile → graph build → Supabase sync

import { NextResponse } from 'next/server'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(): Promise<Response> {
  const steps: string[] = []
  const startTime = Date.now()
  const cwd = process.cwd()

  try {
    // Step 1: Ensure .toon/ directory
    const toonDir = join(cwd, '.toon')
    if (!existsSync(toonDir)) { mkdirSync(toonDir, { recursive: true }); steps.push('✓ Created .toon/ directory') }
    else steps.push('✓ .toon/ directory exists')

    // Step 2: TOON compile — use toongine/toon v3
    try {
      const toonMod = await import('toongine/toon') as any
      if (typeof toonMod.compileAll === 'function') {
        await toonMod.compileAll(cwd)
        steps.push('✓ TOON v3 compilation complete')
      } else if (typeof toonMod.default?.compileAll === 'function') {
        await toonMod.default.compileAll(cwd)
        steps.push('✓ TOON v3 compilation complete')
      } else {
        steps.push('⚠ TOON compile: no compileAll export found')
      }
    } catch (e: any) {
      steps.push(`⚠ TOON compile skipped: ${e.message?.slice(0, 80) || 'unknown error'}`)
    }

    // Step 3: Build graph
    try {
      const graphMod = await import('toongine/graphs') as any
      const buildFn = graphMod.buildAllGraphs || graphMod.default?.buildAllGraphs
      if (typeof buildFn === 'function') {
        const result = buildFn(cwd)
        steps.push(`✓ Graph built: ${result?.graphify || 'ok'}`)
      } else {
        steps.push('⚠ Graph build: no buildAllGraphs export')
      }
    } catch (e: any) {
      steps.push(`⚠ Graph build skipped: ${e.message?.slice(0, 80) || 'unknown error'}`)
    }

    // Step 4: Sync to Supabase
    try {
      const supabaseMod = await import('toongine/plugins/supabase') as any
      if (supabaseMod.isConfigured?.()) {
        const repoId = supabaseMod.resolveRepo?.() || 'unknown'
        steps.push(`✓ Supabase connected (repo: ${repoId})`)
        if (supabaseMod.registerProject) {
          await supabaseMod.registerProject()
          steps.push('✓ Project registered in Supabase')
        } else {
          steps.push('⚠ registerProject not available')
        }
      } else {
        steps.push('⚠ Supabase not configured')
      }
    } catch (e: any) {
      steps.push(`⚠ Supabase sync skipped: ${e.message?.slice(0, 80)}`)
    }

    // Step 5: Write init marker
    writeFileSync(join(toonDir, '.initialized'), new Date().toISOString())
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    steps.push(`✓ Complete in ${duration}s`)

    return NextResponse.json({ success: true, duration: `${duration}s`, steps })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, steps }, { status: 500 })
  }
}
