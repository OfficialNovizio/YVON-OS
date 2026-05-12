/**
 * lib/ai-client.ts — Unified AI provider client factory.
 *
 * Architecture:
 *   - Anthropic  → Anthropic SDK (unique wire format, prompt caching)
 *   - Everything else → single OpenAI-compatible handler (different baseUrl per provider)
 *
 * Active provider is read from Supabase `ai_provider_keys` (60s cache).
 * Falls back to ANTHROPIC_API_KEY env var if no DB key is configured.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { PROVIDER_MODELS } from '@/lib/providers'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ProviderConfig {
  provider:        string
  protocol:        'anthropic' | 'openai-compat'
  apiKey:          string
  baseUrl:         string
  fastModel:       string   // primary   — routing, planning, specialist briefings
  synthesisModel:  string   // secondary — Marcus streaming synthesis
  tertiaryModel:   string   // tertiary  — stored for future deep-analysis / optional
}

// ─── Config cache ─────────────────────────────────────────────────────────────

let _cache:  ProviderConfig | null = null
let _expiry: number = 0

async function loadConfig(): Promise<ProviderConfig> {
  if (_cache && Date.now() < _expiry) return _cache

  try {
    const sbUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

    if (sbUrl && sbKey) {
      const sb = createClient(sbUrl, sbKey)
      const { data } = await sb
        .from('ai_provider_keys')
        .select('provider, api_key, fast_model, synthesis_model, base_url')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        const providerKey = data.provider as string
        const meta = PROVIDER_MODELS[providerKey as keyof typeof PROVIDER_MODELS]
        const resolvedBaseUrl =
          (data.base_url as string | null) ??
          meta?.baseUrl ??
          ''

        _cache = {
          provider:        providerKey,
          protocol:        meta?.protocol ?? 'openai-compat',
          apiKey:          data.api_key as string,
          baseUrl:         resolvedBaseUrl,
          fastModel:       (data.fast_model as string) || '',
          synthesisModel:  (data.synthesis_model as string) || '',
          tertiaryModel:   (data as Record<string, unknown>).tertiary_model as string ?? '',
        }
        _expiry = Date.now() + 60_000
        return _cache!
      }
    }
  } catch { /* fall through */ }

  // Env fallback — Anthropic via environment variable
  _cache = {
    provider:        'anthropic',
    protocol:        'anthropic',
    apiKey:          process.env.ANTHROPIC_API_KEY ?? '',
    baseUrl:         'https://api.anthropic.com',
    fastModel:       'claude-haiku-4-5-20251001',
    synthesisModel:  'claude-sonnet-4-6',
    tertiaryModel:   '',
  }
  _expiry = Date.now() + 60_000
  return _cache!
}

// ─── OpenAI-compatible helpers ────────────────────────────────────────────────

function oaiMessages(system: string | undefined, messages: AIMessage[]) {
  return [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages,
  ]
}

async function oaiCall(
  baseUrl: string,
  apiKey:  string,
  model:   string,
  msgs:    { role: string; content: string }[],
  maxTokens: number,
): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ model, max_tokens: maxTokens, messages: msgs }),
  })
  if (!res.ok) throw new Error(`${baseUrl} ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ''
}

async function* oaiStream(
  baseUrl: string,
  apiKey:  string,
  model:   string,
  msgs:    { role: string; content: string }[],
  maxTokens: number,
): AsyncGenerator<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method:  'POST',
    headers,
    body:    JSON.stringify({ model, max_tokens: maxTokens, messages: msgs, stream: true }),
  })
  if (!res.ok || !res.body) throw new Error(`${baseUrl} ${res.status}`)

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return
      try {
        const chunk = JSON.parse(raw) as { choices: Array<{ delta: { content?: string } }> }
        const text  = chunk.choices[0]?.delta?.content
        if (text) yield text
      } catch { /* skip malformed */ }
    }
  }
}

// ─── callFast — non-streaming fast model (haiku-tier) ────────────────────────

export async function callFast(params: {
  system?:   string
  messages:  AIMessage[]
  maxTokens: number
}): Promise<string> {
  const cfg = await loadConfig()

  if (cfg.protocol === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey })
    const res = await client.messages.create({
      model:      cfg.fastModel,
      max_tokens: params.maxTokens,
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    return res.content[0]?.type === 'text' ? res.content[0].text : ''
  }

  // All OpenAI-compatible providers
  return oaiCall(
    cfg.baseUrl,
    cfg.apiKey,
    cfg.fastModel,
    oaiMessages(params.system, params.messages),
    params.maxTokens,
  )
}

// ─── callSynthesis — non-streaming synthesis model (sonnet-tier) ─────────────

export async function callSynthesis(params: {
  system?:   string
  messages:  AIMessage[]
  maxTokens: number
}): Promise<string> {
  const cfg = await loadConfig()

  if (cfg.protocol === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey })
    const res = await client.messages.create({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    return res.content[0]?.type === 'text' ? res.content[0].text : ''
  }

  return oaiCall(
    cfg.baseUrl,
    cfg.apiKey,
    cfg.synthesisModel,
    oaiMessages(params.system, params.messages),
    params.maxTokens,
  )
}

// ─── streamSynthesis — streaming synthesis model (sonnet-tier) ────────────────

export async function* streamSynthesis(params: {
  system?:   string
  messages:  AIMessage[]
  maxTokens: number
}): AsyncGenerator<string> {
  const cfg = await loadConfig()

  if (cfg.protocol === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey })
    const stream = client.messages.stream({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      messages:   params.messages,
      ...(params.system ? { system: params.system } : {}),
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
    return
  }

  // All OpenAI-compatible providers
  yield* oaiStream(
    cfg.baseUrl,
    cfg.apiKey,
    cfg.synthesisModel,
    oaiMessages(params.system, params.messages),
    params.maxTokens,
  )
}

// ─── Expose active config info (for status bar in War Room) ──────────────────

export async function getActiveProviderInfo() {
  try {
    const cfg = await loadConfig()
    const meta = PROVIDER_MODELS[cfg.provider as keyof typeof PROVIDER_MODELS]
    return {
      provider:       cfg.provider,
      label:          meta?.label ?? cfg.provider,
      fastModel:      cfg.fastModel,
      synthesisModel: cfg.synthesisModel,
      tertiaryModel:  cfg.tertiaryModel,
      baseUrl:        cfg.baseUrl,
    }
  } catch {
    return null
  }
}

// ─── Invalidate cache (call after saving a new key in settings) ───────────────

export function invalidateProviderCache() {
  _cache  = null
  _expiry = 0
}
