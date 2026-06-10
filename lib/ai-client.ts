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

export async function loadConfig(): Promise<ProviderConfig> {
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

        // Detect protocol: check base URL for Anthropic-compatible endpoints.
        // DeepSeek, OpenRouter, and others expose an /anthropic endpoint that
        // supports the full Anthropic tool_use schema. If the URL points to one
        // of these, use the Anthropic protocol so tools (Read, Bash, Github, etc.)
        // are available to agents.
        let protocol: ProviderConfig['protocol'] = meta?.protocol ?? 'openai-compat'
        if (protocol !== 'anthropic' && resolvedBaseUrl) {
          const urlLower = resolvedBaseUrl.toLowerCase()
          if (urlLower.includes('/anthropic') ||
              urlLower.includes('api.deepseek.com') ||
              urlLower.includes('openrouter.ai')) {
            protocol = 'anthropic'
          }
        }

        _cache = {
          provider:        providerKey,
          protocol,
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
    fastModel:       'claude-sonnet-4-6',
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

// ─── callFast — non-streaming primary model ───────────────────────────────────
// Uses fastModel (PRIMARY — whatever the user configured as their best model).
// For DeepSeek: deepseek-v4-pro. For Anthropic default: Sonnet (not Haiku).
// CEO + Technical agents use this tier. Others use callSynthesis.

export async function callFast(params: {
  system?:   string
  messages:  AIMessage[]
  maxTokens: number
}): Promise<string> {
  const cfg = await loadConfig()

  if (cfg.protocol === 'anthropic') {
    const client = new Anthropic({ apiKey: cfg.apiKey, ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}) })
    const thinking = getThinkingConfig(cfg.fastModel, 'fast')
    const res = await client.messages.create({
      model:      cfg.fastModel,
      max_tokens: params.maxTokens,
      ...(thinking ? { thinking } : {}),
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    trackTokenUsage({ model: cfg.fastModel, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, cacheReadTokens: (res.usage as any).cache_read_input_tokens, route: 'call-fast' })
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
    const thinking = getThinkingConfig(cfg.synthesisModel, 'synthesis')
    const res = await client.messages.create({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      ...(thinking ? { thinking } : {}),
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
      messages: params.messages,
    })
    const textBlock = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    trackTokenUsage({ model: cfg.synthesisModel, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, cacheReadTokens: (res.usage as any).cache_read_input_tokens, route: 'call-synthesis' })
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

    const thinking = getThinkingConfig(cfg.synthesisModel, 'synthesis')
    const stream = client.messages.stream({
      model:      cfg.synthesisModel,
      max_tokens: params.maxTokens,
      messages:   sdkMessages,
      ...(thinking ? { thinking } : {}),
      // Cache system prompt — synthesis is called once per session but system prompt
      // can be 20 KB+; caching avoids re-processing on retries and CEO-only calls.
      ...(params.system ? {
        system: [{ type: 'text' as const, text: params.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
    })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
    // Track usage after stream completes
    const finalMsg = await stream.finalMessage()
    trackTokenUsage({ model: cfg.synthesisModel, inputTokens: finalMsg.usage.input_tokens, outputTokens: finalMsg.usage.output_tokens, route: 'stream-synthesis' })
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
  /** When true, strips write_file and delete_file from Github tool schema. For validators/QA. */
  readOnly?: boolean
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
      modelTier:    params.modelTier,
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
  let tools = toolsForAgent(params.agentId).filter(t =>
    isProductVenture && !isLocalMode ? !LOCAL_FS_TOOL_NAMES.includes(t.name) : true
  )

  // ⛔ READ-ONLY MODE: Strip write actions from Github tool schema.
  // Used by validators (Quinn QA, Kahneman, Felix) — they REPORT errors, never fix.
  if (params.readOnly) {
    tools = tools.map(t => {
      if (t.name !== 'Github') return t
      // Remove write_file and delete_file from the Github action enum
      const schema = { ...t, input_schema: { ...t.input_schema } }
      const props = schema.input_schema.properties as Record<string, unknown>
      const actionProp = props['action'] as { enum?: string[] } | undefined
      if (actionProp?.enum) {
        actionProp.enum = actionProp.enum.filter(a => a !== 'write_file' && a !== 'delete_file')
      }
      // Also update description to note writes are blocked
      if (schema.description) {
        schema.description = schema.description.replace(/WRITE:.*?(?=\bREAD\b|$)/, 'WRITE: ⛔ BLOCKED (read-only mode). ')
      }
      return schema
    })
  }

  const thinkingConfig = getThinkingConfig(model, params.modelTier)

  yield* runToolLoop({
    client,
    model,
    maxTokens:       params.maxTokens,
    system:          params.system,
    thinking:        thinkingConfig,
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

// ─── Semantic Intent Classification ────────────────────────────────────────────
// Replaces keyword-based routing with Claude-powered semantic understanding.
// Uses the fast model (Haiku-tier) for speed; falls back to synthesis model
// (Sonnet-tier) if confidence is low. Preserves all HARD RULES from the original
// keyword classifier — stack traces → QA, auth errors → backend, UI → frontend,
// and the SCREEN RULE (screen/component analysis NEVER routes to strategy).

export interface SemanticIntentResult {
  command: 'fix' | 'improve' | 'analyze' | 'report' | 'suggest'
  domain: 'technical' | 'marketing' | 'finance' | 'strategy' | 'mixed'
  layer: 'frontend' | 'backend' | 'fullstack' | 'data' | 'content' | 'visual' | 'none'
  confidence: number
  reasoning: string
}

interface ClassifierCacheEntry {
  result: SemanticIntentResult
  expiry: number
}

const _classifierCache = new Map<string, ClassifierCacheEntry>()

function buildClassifierSystemPrompt(ventureName: string, techStack: string): string {
  const isFlutter = techStack.includes('Flutter')
  const dbTech    = techStack.includes('Firebase') ? 'Firebase' : 'Supabase'
  const frameworkTech = isFlutter ? 'Flutter/Dart' : 'Next.js/TypeScript'
  const frontendScope = isFlutter
    ? 'Flutter screens, widgets, navigation, mobile UX, Dart UI code'
    : 'React/Next.js UI components, Tailwind CSS, layout, UX'

  return `You are an intent classifier for a multi-agent AI system. Given a user message, classify it into exactly one command, domain, and layer. Return JSON only — no explanation.

VENTURE: ${ventureName} — ${techStack}

COMMAND (pick exactly one):
- fix        — something is broken, bug, error, crash, not working, needs repair
- improve    — something works but could be better, optimize, enhance, upgrade
- analyze    — deep investigation, understand why something happened, root cause
- report     — gather information and present findings, overview, status update
- suggest    — advisory, what should we do, recommendation, options

DOMAIN (pick exactly one):
- technical  — code, infrastructure, deployment, architecture, APIs, database
- marketing  — content, ads, brand, social media, copy, visuals, growth
- finance    — budget, P&L, pricing, revenue, costs, runway
- strategy   — business direction, priorities, OKRs, competitive positioning
- mixed      — genuinely spans two or more domains

LAYER (pick exactly one):
- frontend   — UI, screens, components, styling, layout, visual design, UX
- backend    — APIs, database, server logic, auth, data models
- fullstack  — touches both frontend and backend
- data       — analytics, metrics, numbers, trends, statistics
- content    — copy, messaging, brand voice, captions, creative
- visual     — images, art direction, mood boards, design assets
- none       — no specific technical layer (strategy/finance questions)

HARD RULES — these override everything above:
1. Any pasted error, stack trace, exception, crash → command:fix, domain:technical, layer:fullstack
2. Auth error, login not working, ${dbTech} auth → command:fix, domain:technical, layer:backend
3. UI / screen / component / layout / design / styling / UX → layer:frontend (even if the message also mentions data or logic)
4. ⛔ SCREEN RULE: Any request to "analyze", "review", "explain", or "check" a screen, component, widget, or page → domain:technical, layer:frontend. The word "screen" in an app context means UI — it NEVER routes to strategy or operations.
5. "Create a report on the code" or "report on the repo" → command:report (NOT fix/improve). Report requests override action keywords.
6. Strategy/business keywords (OKRs, priorities, pricing model, competitive position) without code/technical context → domain:strategy

Return ONLY valid JSON:
{"command":"<command>","domain":"<domain>","layer":"<layer>","confidence":<0-1>,"reasoning":"<one sentence>"}`
}

export async function classifyIntentSemantic(
  message: string,
  ventureName?: string,
  ventureSlug?: string,
): Promise<SemanticIntentResult> {
  const cleanMsg = message.replace(/^\[CONTEXT:[^\]]+\][^\n]*\n*/i, '').trim()

  // Cache key: hash of message + venture
  const cacheKey = `${cleanMsg.slice(0, 200)}|${ventureSlug ?? ''}`
  const cached = _classifierCache.get(cacheKey)
  if (cached && Date.now() < cached.expiry) return cached.result

  const techStack = ventureSlug
    ? (await import('@/lib/ventures')).VENTURE_TECH_STACK[ventureSlug] ?? 'web/mobile app'
    : 'web/mobile app'
  const name = ventureName ?? 'Novizio'
  const systemPrompt = buildClassifierSystemPrompt(name, techStack)

  const fallback: SemanticIntentResult = {
    command: 'analyze',
    domain: 'strategy',
    layer: 'none',
    confidence: 0.5,
    reasoning: 'Classifier unavailable — fallback to strategy analysis',
  }

  try {
    // First pass: fast model (Haiku-tier) for speed
    const raw = await callFast({
      system: systemPrompt,
      messages: [{ role: 'user', content: cleanMsg }],
      maxTokens: 512,
    })

    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      // Retry with synthesis model — sometimes fast models produce malformed JSON
      const retryRaw = await callSynthesis({
        system: systemPrompt,
        messages: [{ role: 'user', content: cleanMsg }],
        maxTokens: 512,
      })
      const retryMatch = retryRaw.match(/\{[\s\S]*\}/)
      if (!retryMatch) {
        _classifierCache.set(cacheKey, { result: fallback, expiry: Date.now() + 30_000 })
        return fallback
      }
      const parsed = JSON.parse(retryMatch[0]) as Record<string, unknown>
      return validateAndCache(parsed, cacheKey, fallback)
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>
    const result = validateAndCache(parsed, cacheKey, fallback)

    // Low confidence → escalate to synthesis model with extended context
    if (result.confidence < 0.85) {
      const retryRaw = await callSynthesis({
        system: `${systemPrompt}\n\nYour previous classification had low confidence (${result.confidence}). Re-read the user message carefully and re-classify with higher precision.`,
        messages: [{ role: 'user', content: cleanMsg }],
        maxTokens: 512,
      })
      const retryMatch = retryRaw.match(/\{[\s\S]*\}/)
      if (retryMatch) {
        try {
          const retryParsed = JSON.parse(retryMatch[0]) as Record<string, unknown>
          const retryResult = validateAndCache(retryParsed, cacheKey, fallback)
          if (retryResult.confidence > result.confidence) return retryResult
        } catch { /* keep original */ }
      }
    }

    return result
  } catch {
    _classifierCache.set(cacheKey, { result: fallback, expiry: Date.now() + 30_000 })
    return fallback
  }
}

const VALID_COMMANDS = new Set(['fix', 'improve', 'analyze', 'report', 'suggest'])
const VALID_DOMAINS  = new Set(['technical', 'marketing', 'finance', 'strategy', 'mixed'])
const VALID_LAYERS   = new Set(['frontend', 'backend', 'fullstack', 'data', 'content', 'visual', 'none'])

function validateAndCache(
  raw: Record<string, unknown>,
  cacheKey: string,
  fallback: SemanticIntentResult,
): SemanticIntentResult {
  const command = typeof raw.command === 'string' && VALID_COMMANDS.has(raw.command)
    ? (raw.command as SemanticIntentResult['command'])
    : fallback.command
  const domain = typeof raw.domain === 'string' && VALID_DOMAINS.has(raw.domain)
    ? (raw.domain as SemanticIntentResult['domain'])
    : fallback.domain
  const layer = typeof raw.layer === 'string' && VALID_LAYERS.has(raw.layer)
    ? (raw.layer as SemanticIntentResult['layer'])
    : fallback.layer
  const confidence = typeof raw.confidence === 'number' && raw.confidence >= 0 && raw.confidence <= 1
    ? raw.confidence
    : 0.7
  const reasoning = typeof raw.reasoning === 'string'
    ? raw.reasoning.slice(0, 200)
    : ''

  const result: SemanticIntentResult = { command, domain, layer, confidence, reasoning }
  // Cache for 60 seconds — prevents redundant calls on retries and follow-ups
  _classifierCache.set(cacheKey, { result, expiry: Date.now() + 60_000 })
  return result
}

// ─── Invalidate cache (call after saving a new key in settings) ───────────────

export function invalidateProviderCache() {
  _cache  = null
  _expiry = 0
}

// ─── Thinking Configuration ─────────────────────────────────────────────────
// Extended / Adaptive Thinking for Claude models. DeepSeek and other providers
// using the Anthropic wire protocol don't support the thinking parameter.

export type ThinkingConfig = { type: 'adaptive' } | { type: 'enabled'; budget_tokens: number }

/**
 * Returns the appropriate thinking config for a given model and tier.
 * - Opus 4.8 → adaptive (model decides dynamically)
 * - Sonnet 4.6/4.7 → extended (fixed budget, 2000–4000 tokens)
 * - Haiku / non-Claude → undefined (no thinking)
 */
export function getThinkingConfig(
  model: string,
  tier?: 'fast' | 'synthesis' | 'tier1',
): ThinkingConfig | undefined {
  // Only Claude models support the thinking API
  if (!model.includes('claude')) return undefined

  const isOpus = model.includes('opus')

  if (isOpus) {
    // Opus 4.8 supports adaptive thinking — model decides per-query
    return { type: 'adaptive' as const }
  }

  // Sonnet-tier: extended thinking with fixed budget
  if (tier === 'tier1') {
    return { type: 'enabled' as const, budget_tokens: 4000 }
  }
  if (tier === 'synthesis') {
    return { type: 'enabled' as const, budget_tokens: 2000 }
  }
  // Fast tier: no thinking (Haiku doesn't support it, and fast responses
  // for routing/planning don't benefit from extended reasoning)
  return undefined
}

// ─── Token Usage Tracking ─────────────────────────────────────────────────────
// Fire-and-forget: writes token usage to Supabase after every LLM call completes.
// Never blocks the response — failures are silent.

async function trackTokenUsage(params: {
  agentId?: string
  route?: string
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  ventureId?: string
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return

  try {
    await fetch(`${supabaseUrl}/rest/v1/token_usage`, {
      method: 'POST',
      headers: {
        apikey:        supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer:        'return=minimal',
      },
      body: JSON.stringify({
        agent_id:              params.agentId ?? null,
        route:                 params.route ?? 'unknown',
        model:                 params.model,
        input_tokens:          params.inputTokens,
        output_tokens:         params.outputTokens,
        cache_read_tokens:     params.cacheReadTokens ?? 0,
        cache_creation_tokens: params.cacheCreationTokens ?? 0,
        cost_usd:              0, // computed server-side or estimated later
        venture_id:            params.ventureId ?? null,
      }),
      signal: AbortSignal.timeout(3000), // 3s timeout, don't block
    })
  } catch {
    // silent — tracking is best-effort, never blocks the response
  }
}
