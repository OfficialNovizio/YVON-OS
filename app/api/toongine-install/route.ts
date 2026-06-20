// app/api/toongine-install/route.ts
// Handles local ToonGine installation for YVON OS
// Runs npm install — never committed to repo

import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cwd = process.cwd()
    const pkgPath = path.join(cwd, 'package.json')
    const nodeModules = path.join(cwd, 'node_modules', 'toongine')
    const installed = existsSync(nodeModules)

    // Check gitignore status
    const gitignored = existsSync(path.join(cwd, '.gitignore'))
      ? true
      : false

    return NextResponse.json({
      installed,
      gitignored,
      packagePath: pkgPath,
    })
  } catch (err: any) {
    return NextResponse.json({ installed: false, error: err.message })
  }
}

export async function POST() {
  try {
    const cwd = process.cwd()

    // Run npm install for ToonGine from GitHub
    const { stdout, stderr } = await execAsync(
      'npm install github:OfficialNovizio/ToonGine',
      { cwd, timeout: 120_000 }
    )

    return NextResponse.json({
      success: true,
      message: 'ToonGine installed successfully',
      output: stdout.slice(-200),
    })
  } catch (err: any) {
    console.error('[toongine-install]', err)
    return NextResponse.json(
      { success: false, error: err.stderr || err.message },
      { status: 500 }
    )
  }
}
