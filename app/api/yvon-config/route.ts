import { NextRequest, NextResponse } from 'next/server'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const CONFIG_PATH = join(process.cwd(), 'toongine.config.json')
const LEGACY_CONFIG_PATH = join(process.cwd(), 'yvon.config.json')

const DEFAULTS = {
  dashboard: { showInSettings: true, autoStartOnDev: true, port: 4200, theme: 'dark' },
  cie: { enabled: true, contextCap: 2500, adaptiveInjection: true },
  toon: { enabled: true, bidirectional: true },
  modules: ['graphify', 'codegraph', 'code-review-graph'],
}

function loadConfig() {
  if (existsSync(CONFIG_PATH)) {
    try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) } catch {}
  }
  // Fallback to legacy config file
  if (existsSync(LEGACY_CONFIG_PATH)) {
    try { return JSON.parse(readFileSync(LEGACY_CONFIG_PATH, 'utf-8')) } catch {}
  }
  return { ...DEFAULTS }
}

export async function GET() {
  return NextResponse.json(loadConfig())
}

export async function PATCH(req: NextRequest) {
  const { key, value } = await req.json()
  const config = loadConfig()

  const keys = key.split('.')
  let obj = config
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {}
    obj = obj[keys[i]]
  }
  obj[keys[keys.length - 1]] = value

  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
  return NextResponse.json({ ok: true })
}
