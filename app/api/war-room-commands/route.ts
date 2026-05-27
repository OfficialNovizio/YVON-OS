/**
 * /api/war-room-commands — CRUD for custom War Room slash commands.
 *
 * GET    /api/war-room-commands           → { commands: SlashCmd[] }
 * POST   /api/war-room-commands           → upsert  { cmd, label, prompt, sort_order? }
 * DELETE /api/war-room-commands?cmd=/foo  → delete by cmd key
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface SlashCmd {
  cmd:        string
  label:      string
  prompt:     string
  sort_order: number
}

function sb() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export async function GET() {
  try {
    const { data, error } = await sb()
      .from('war_room_commands')
      .select('cmd, label, prompt, sort_order')
      .order('sort_order', { ascending: true })
      .order('cmd', { ascending: true })
    if (error) throw error
    return Response.json({ commands: (data ?? []) as SlashCmd[] })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  let body: { cmd?: string; label?: string; prompt?: string; sort_order?: number }
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { cmd, label, prompt, sort_order = 0 } = body
  if (!cmd?.trim())    return Response.json({ error: 'cmd is required' },    { status: 400 })
  if (!label?.trim())  return Response.json({ error: 'label is required' },  { status: 400 })
  if (!prompt?.trim()) return Response.json({ error: 'prompt is required' }, { status: 400 })

  const normalised = cmd.trim().startsWith('/') ? cmd.trim() : `/${cmd.trim()}`

  try {
    const { error } = await sb()
      .from('war_room_commands')
      .upsert(
        { cmd: normalised, label: label.trim(), prompt: prompt.trim(), sort_order, updated_at: new Date().toISOString() },
        { onConflict: 'cmd' },
      )
    if (error) throw error
    return Response.json({ ok: true, cmd: normalised })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const cmd = new URL(req.url).searchParams.get('cmd')
  if (!cmd) return Response.json({ error: 'cmd query param required' }, { status: 400 })

  try {
    const { error } = await sb().from('war_room_commands').delete().eq('cmd', cmd)
    if (error) throw error
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
