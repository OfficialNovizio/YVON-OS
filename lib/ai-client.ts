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
import { runToolLoop, type ToolLoopEvent } from '@/lib/tool-loop'
import { toolsForAgent } from '@/lib/agent-tools'
import { runAgentSdk, isAgentSdkEnabled } from '@/lib/agent-sdk-runner'

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
  fastModel:       string   // Haiku-tier  — routing, planning, fast specialists
  synthesisModel:  string   // Sonnet-tier — Marcus streaming synthesis
  tier1Model:      string   // Opus-tier   — dev-lead, raj-backend (complex reasoning)
  tertiaryModel:   string   // stored for future deep-analysis / optional
}

// ─── Config cache ─────────────────────────────────────────────────────────────

let _cache:  ProviderConfig | null = null
let _expiry: number = 0

/** Call after saving a provider key so the next request loads fresh config. */
export function bustProviderCache() {
  _cache  = null
  _expiry = 0
}

async function loadConfig(): Promise<ProviderConfig> {
  if (_cache && Date.now() < _expiry) return _cache

  try {
    const sbUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

    if (sbUrl && sbKey) {
      const sb = createClient(sbUrl, sbKey)
      const { data } = await sb
        .from('ai_provider_keys')
        .select('provider, api_key, fast_model, synthesis_model, tier1_model, base_url, tertiary_model')
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
        const rec = data as Record<string, unknown>
        const resolvedFast      = (data.fast_model as string) || ''
        const resolvedSynthesis = (data.synthesis_model as string) || ''

        _cache = {
          provider:        providerKey,
          protocol:        meta?.protocol ?? 'openai-compat',
          apiKey:          data.api_key as string,
          baseUrl:         resolvedBaseUrl,
          fastModel:       resolvedFast,
          synthesisModel:  resolvedSynthesis,
          // tier1_model falls back to synthesisModel so Opus agents still run on
          // the best available model even when not explicitly configured.
          tier1Model:      (rec.tier1_model as string | null) || resolvedSynthesis || resolvedFast,
          tertiaryModel:   rec.tertiary_model as string ?? '',
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
    tier1Model:      'claude-opus-4-6',
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
  const data = await res.json() as { choices: Array<{ message: { content?: string; reasoning_content?: string } }> }
  // Prefer content; fall back to reasoning_content for Qwen3/local models that blend thinking+reply
  return data.choices[0]?.message?.content || data.choices[0]?.message?.reasoning_content || ''
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
  let sawContent = false

  // Two-pass approach: buffer reasoning_content chunks until we see real content.
  // If real content appears, discard buffered reasoning and stream content only.
  // If stream ends with no real content (some llama.cpp builds), yield the reasoning as fallback.
  const reasoningBuf: string[] = []

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
        const chunk = JSON.parse(raw) as { choices: Array<{ delta: { content?: string; reasoning_content?: string } }> }
        const content   = chunk.choices[0]?.delta?.content
        const reasoning = chunk.choices[0]?.delta?.reasoning_content
        if (content) {
          sawContent = true
          yield content
        } else if (reasoning && !sawContent) {
          // Buffer silently — only emit if no real content ever arrives
          reasoningBuf.push(reasoning)
        }
      } catch { /* skip malformed */ }
    }
  }

  // If the model only produced reasoning tokens (no content field ever set), yield them as fallback
  if (!sawContent && reasoningBuf.length > 0) {
    yield reasoningBuf.join('')
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
    const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) })
    const res = await client.messages.create({
      model:      cfg.fastModel,
      max_tokens: params.maxTokens,
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    return textBlock ? textBlock.text : ''
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
    const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) })
    const res = await client.messages.create({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    return textBlock ? textBlock.text : ''
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
  system?:       string
  messages:      AIMessage[]
  maxTokens:     number
  imageBase64?:  string
  imageMimeType?: string
}): AsyncGenerator<string> {
  const cfg = await loadConfig()

  if (cfg.protocol === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) })

    // Build messages, injecting image into last user turn if provided
    type AnthropicMsg = Parameters<typeof client.messages.stream>[0]['messages'][number]
    let sdkMessages: AnthropicMsg[] = params.messages.map(m => ({
      role:    m.role,
      content: m.content,
    }))

    if (params.imageBase64 && params.imageMimeType && sdkMessages.length > 0) {
      const last = sdkMessages[sdkMessages.length - 1]
      if (last.role === 'user') {
        sdkMessages = [
          ...sdkMessages.slice(0, -1),
          {
            role: 'user' as const,
            content: [
              {
                type:   'image' as const,
                source: {
                  type:       'base64' as const,
                  media_type: params.imageMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data:       params.imageBase64,
                },
              },
              { type: 'text' as const, text: last.content as string },
            ],
          },
        ]
      }
    }

    const stream = client.messages.stream({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      messages:   sdkMessages,
      ...(params.system ? { system: params.system } : {}),
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
    return
  }

  // All OpenAI-compatible providers (image passed as text note via prompt)
  yield* oaiStream(
    cfg.baseUrl,
    cfg.apiKey,
    cfg.synthesisModel,
    oaiMessages(params.system, params.messages),
    params.maxTokens,
  )
}

// ─── streamWithTools — tool-use loop using the fast model (used for specialists) ──
// Yields a typed event stream from lib/tool-loop.ts. Falls back to plain streaming
// if the active provider isn't Anthropic-wire-compatible (OpenAI-compat can't run
// the Anthropic tool_use schema without a translation layer).

export async function* streamWithTools(params: {
  agentId:   string
  system?:   string
  messages:  AIMessage[]
  maxTokens: number
  /** 'fast' | 'synthesis' | 'tier1'. Resolved from DB config — tier1=Opus, synthesis=Sonnet, fast=Haiku. */
  modelTier?: 'fast' | 'synthesis' | 'tier1'
  /** Optional cap on tool loop iterations. Default 8. */
  maxIterations?: number
  /** Venture slug — required for the Github tool to resolve the active repo. */
  ventureSlug?: string
  /** 'github' (default) | 'local' — when local, FS tools are included in schema + not blocked */
  repoMode?: 'github' | 'local'
  /** Absolute local path to the venture's cloned repo (only used when repoMode=local) */
  localRepoPath?: string
}): AsyncGenerator<ToolLoopEvent> {
  // Engine switch: WAR_ROOM_ENGINE=agent_sdk routes through Claude Agent SDK
  // (full Claude Code engine, subprocess). Only used for YVON Dashboard — product
  // ventures must use the Client SDK tool loop so the Github tool is available.
  const isYvonDashboard = !params.ventureSlug || params.ventureSlug === 'yvon-dashboard'
  if (isYvonDashboard && await isAgentSdkEnabled()) {
    const userMsg = params.messages.filter(m => m.role === 'user').map(m => m.content).join('\n\n')
    yield* runAgentSdk({
      agentId:      params.agentId,
      systemPrompt: params.system ?? '',
      userPrompt:   userMsg,
      modelTier:    params.modelTier === 'tier1' ? 'synthesis' : params.modelTier,
    })
    return
  }

  const cfg = await loadConfig()
  const model = params.modelTier === 'synthesis'
    ? cfg.synthesisModel
    : params.modelTier === 'tier1'
    ? (cfg.tier1Model || cfg.synthesisModel)
    : cfg.fastModel

  if (cfg.protocol !== 'anthropic') {
    // OpenAI-compatible endpoints: Anthropic tool_use schema not compatible — tools stripped.
    // Agents respond from context only (no file reads, GitHub, or Bash available).
    yield { kind: 'error', message: `Tool use unavailable: provider "${cfg.provider}" uses OpenAI-compatible protocol. Agents respond from context only — no file reads, no GitHub access. Switch to an Anthropic provider in Settings to enable tools.` }
    yield { kind: 'iteration', n: 1 }
    let buf = ''
    for await (const chunk of streamSynthesis({ system: params.system, messages: params.messages, maxTokens: params.maxTokens })) {
      buf += chunk
      yield { kind: 'text', text: chunk }
    }
    void buf
    yield { kind: 'done', reason: 'end_turn' }
    return
  }

  const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) })
  const isProductVenture = params.ventureSlug && params.ventureSlug !== 'yvon-dashboard'
  const isLocalMode      = params.repoMode === 'local'
  const LOCAL_FS_TOOL_NAMES = ['Read', 'Glob', 'Grep', 'Bash']
  // In GitHub mode: strip FS tools from schema so the model doesn't try to call them.
  // In local mode: include them — user has explicitly enabled local filesystem access.
  const tools = toolsForAgent(params.agentId).filter(t =>
    isProductVenture && !isLocalMode ? !LOCAL_FS_TOOL_NAMES.includes(t.name) : true
  )

  yield* runToolLoop({
    client,
    model,
    maxTokens:       params.maxTokens,
    system:          params.system,
    tools,
    initialMessages: params.messages.map(m => ({ role: m.role, content: m.content })),
    maxIterations:   params.maxIterations,
    toolContext:     { ventureSlug: params.ventureSlug, repoMode: params.repoMode, localRepoPath: params.localRepoPath },
  })
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
      tier1Model:     cfg.tier1Model,
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
