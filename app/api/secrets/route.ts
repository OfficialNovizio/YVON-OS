/**
 * /api/secrets — list mask + set/delete app secrets stored in Supabase Vault.
 * Values are NEVER returned to the browser. Only names, descriptions, timestamps.
 *
 * GET  /api/secrets         → list all secrets (masked)
 * POST /api/secrets { name, value, description? } → upsert
 * DELETE /api/secrets { name } → delete
 */

import { NextRequest } from 'next/server'
import { setSecret, deleteSecret, listSecrets } from '@/lib/secrets'

export async function GET() {
  try {
    const list = await listSecrets()
    return Response.json({ secrets: list })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let body: { name?: string; value?: string; description?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name, value, description } = body
  if (!name || value === undefined) return Response.json({ error: 'name and value required' }, { status: 400 })

  try {
    await setSecret(name, value, description ?? '')
    return Response.json({ ok: true, name })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  let body: { name?: string }
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { name } = body
  if (!name) return Response.json({ error: 'name required' }, { status: 400 })

  try {
    const existed = await deleteSecret(name)
    return Response.json({ ok: true, name, existed })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
