/**
 * POST /api/ai-keys/test
 * Makes a minimal real call to verify a key + endpoint before saving.
 * Key is NOT persisted — purely for pre-save verification.
 *
 * Body: { provider, apiKey?, baseUrl?, fastModel? }
 */

import { NextRequest } from 'next/server'
import { PROVIDER_MODELS } from '@/lib/providers'

export async function POST(request: NextRequest) {
  let body: { provider?: string; apiKey?: string; baseUrl?: string; fastModel?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { provider, apiKey = '', baseUrl, fastModel } = body
  if (!provider) return Response.json({ error: 'provider is required' }, { status: 400 })

  const meta = PROVIDER_MODELS[provider as keyof typeof PROVIDER_MODELS] ?? PROVIDER_MODELS.custom

  // Resolve base URL: request override → hardcoded default for named providers
  const resolvedBase = (baseUrl?.trim() || meta.baseUrl).replace(/\/$/, '')

  try {
    // ── Anthropic — native wire format (supports custom baseURL, e.g. DeepSeek's /anthropic) ──
    if (meta.protocol === 'anthropic') {
      const testModel = fastModel?.trim() || 'claude-haiku-4-5-20251001'
      const anthropicBase = (resolvedBase || 'https://api.anthropic.com').replace(/\/$/, '')
      const res = await fetch(`${anthropicBase}/v1/messages`, {
        method:  'POST',
        headers: {
          'x-api-key':         apiKey,
          'authorization':     `Bearer ${apiKey}`,
          'anthropic-version': '2023-06-01',
          'Content-Type':      'application/json',
        },
        body: JSON.stringify({
          model:      testModel,
          max_tokens: 5,
          messages:   [{ role: 'user', content: 'hi' }],
        }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } }
        return Response.json({ ok: false, error: err?.error?.message ?? `HTTP ${res.status}` })
      }
      return Response.json({ ok: true, provider })
    }

    // ── OpenAI-compatible — covers every other provider ───────────────────────
    if (!resolvedBase) {
      return Response.json({ ok: false, error: 'Base URL is required for custom providers' })
    }

    const testModel = fastModel?.trim() || 'gpt-4o-mini'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    // Only add auth header if API key is provided (local servers don't need it)
    if (apiKey && apiKey !== 'none') headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(`${resolvedBase}/chat/completions`, {
      method:  'POST',
      headers,
      body: JSON.stringify({
        model:      testModel,
        max_tokens: 5,
        messages:   [{ role: 'user', content: 'hi' }],
      }),
    })

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`
      try {
        const err = await res.json() as { error?: { message?: string } | string }
        errMsg = typeof err.error === 'string'
          ? err.error
          : (err.error?.message ?? errMsg)
      } catch { /* keep status text */ }
      return Response.json({ ok: false, error: errMsg })
    }

    return Response.json({ ok: true, provider, baseUrl: resolvedBase })

  } catch (err) {
    return Response.json({ ok: false, error: String(err) })
  }
}
