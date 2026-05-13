/**
 * /api/ai-keys — CRUD for AI provider API keys stored in Supabase.
 * Keys are NEVER returned in plaintext — only masked previews.
 * All operations require service role — browser never touches this directly.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { PROVIDER_MODELS } from '@/lib/providers'
import { bustProviderCache } from '@/lib/ai-client'

function getServiceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) throw new Error('Supabase service credentials not configured')
  return createClient(url, key)
}

function maskKey(key: string): string {
  if (key.length < 12) return '••••••••'
  return key.slice(0, 6) + '••••••••' + key.slice(-4)
}

// ─── GET — list all configured providers (masked keys) ────────────────────────

export async function GET() {
  try {
    const sb = getServiceClient()
    const { data, error } = await sb
      .from('ai_provider_keys')
      .select('id, provider, fast_model, synthesis_model, tertiary_model, is_active, updated_at')
      .order('updated_at', { ascending: false })

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Also fetch masked key preview separately so we never leak plaintext
    const { data: keysData } = await sb
      .from('ai_provider_keys')
      .select('provider, api_key')

    const masked = (keysData ?? []).reduce<Record<string, string>>((acc, r) => {
      acc[r.provider] = maskKey(r.api_key as string)
      return acc
    }, {})

    // Also fetch base_url for display
    const { data: extData } = await sb
      .from('ai_provider_keys')
      .select('provider, base_url')

    const baseUrls = (extData ?? []).reduce<Record<string, string>>((acc, r) => {
      acc[r.provider] = (r.base_url as string | null) ?? ''
      return acc
    }, {})

    const rows = (data ?? []).map(r => ({
      ...r,
      apiKeyMasked: masked[r.provider] ?? '••••••••',
      base_url:     baseUrls[r.provider] ?? '',
    }))

    return Response.json({ providers: rows, meta: PROVIDER_MODELS })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

// ─── POST — upsert a provider key ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { provider?: string; apiKey?: string; fastModel?: string; synthesisModel?: string; tertiaryModel?: string; isActive?: boolean; baseUrl?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider, apiKey, fastModel, synthesisModel, tertiaryModel, isActive, baseUrl } = body

  // Accept any provider key (anthropic, custom, or legacy named providers)
  const meta = provider ? PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS] : null
  if (!provider || (!apiKey && meta?.needsKey)) {
    return Response.json({ error: 'provider and apiKey are required' }, { status: 400 })
  }

  try {
    const sb = getServiceClient()

    const { error } = await sb.from('ai_provider_keys').upsert({
      provider,
      api_key:         apiKey ?? '',
      fast_model:      fastModel ?? '',
      synthesis_model: synthesisModel ?? '',
      tertiary_model:  tertiaryModel ?? '',
      is_active:       isActive ?? true,
      base_url:        baseUrl ?? null,
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'provider' })

    if (error) {
      console.error('[ai-keys POST] upsert error:', error.message, error.details)
      return Response.json({ error: error.message, details: error.details }, { status: 500 })
    }

    bustProviderCache()
    return Response.json({
      ok:           true,
      provider,
      apiKeyMasked: apiKey ? maskKey(apiKey) : '(no key)',
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

// ─── DELETE — remove a provider key ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  let body: { provider?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider } = body
  if (!provider) return Response.json({ error: 'provider is required' }, { status: 400 })

  try {
    const sb = getServiceClient()
    const { error } = await sb.from('ai_provider_keys').delete().eq('provider', provider)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    bustProviderCache()
    return Response.json({ ok: true, provider })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}

// ─── PATCH — toggle active / update models only (no key change) ──────────────

export async function PATCH(request: NextRequest) {
  let body: { provider?: string; fastModel?: string; synthesisModel?: string; tertiaryModel?: string; isActive?: boolean; baseUrl?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider, fastModel, synthesisModel, tertiaryModel, isActive, baseUrl } = body
  if (!provider) return Response.json({ error: 'provider is required' }, { status: 400 })

  try {
    const sb = getServiceClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (fastModel !== undefined)      updates.fast_model      = fastModel
    if (synthesisModel !== undefined) updates.synthesis_model = synthesisModel
    if (tertiaryModel !== undefined)  updates.tertiary_model  = tertiaryModel
    if (isActive !== undefined)       updates.is_active       = isActive
    if (baseUrl !== undefined)        updates.base_url        = baseUrl || null

    const { error } = await sb.from('ai_provider_keys').update(updates).eq('provider', provider)
    if (error) {
      console.error('[ai-keys PATCH] update error:', error.message, error.details)
      return Response.json({ error: error.message, details: error.details }, { status: 500 })
    }
    bustProviderCache()
    return Response.json({ ok: true, provider })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
