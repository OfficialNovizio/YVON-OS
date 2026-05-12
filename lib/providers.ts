/**
 * AI provider registry — simplified to two protocols:
 *   anthropic    → Anthropic SDK (native, prompt caching, unique wire format)
 *   openai-compat → Any OpenAI-compatible endpoint (OpenAI, DeepSeek, Ollama, LM Studio, etc.)
 *
 * Adding a new named provider = one entry in KNOWN_ENDPOINTS below (no code changes).
 */

export type ProviderProtocol = 'anthropic' | 'openai-compat'

export interface ProviderMeta {
  label:     string
  color:     string
  icon:      string
  protocol:  ProviderProtocol
  baseUrl:   string          // canonical base URL (overridable in DB)
  needsKey:  boolean
  docsUrl:   string
}

// ── The two first-class providers ─────────────────────────────────────────────

export const PROVIDER_MODELS: Record<'anthropic' | 'custom', ProviderMeta> = {
  anthropic: {
    label:    'Anthropic',
    color:    '#e07547',
    icon:     '🟠',
    protocol: 'anthropic',
    baseUrl:  'https://api.anthropic.com',
    needsKey: true,
    docsUrl:  'https://console.anthropic.com/settings/keys',
  },
  custom: {
    label:    'Custom / OpenAI-Compatible',
    color:    '#0071e3',
    icon:     '⚙️',
    protocol: 'openai-compat',
    baseUrl:  '',      // user must supply
    needsKey: false,   // optional (some local servers don't need one)
    docsUrl:  '',
  },
}

// ── Auto-detect: URL pattern → provider label + suggested models ───────────────
// When the user pastes a base URL, we scan this list and auto-fill the label
// and suggest starter models. The user can override everything.

export interface DetectedProvider {
  label:   string
  icon:    string
  color:   string
  primary:   string   // suggested fast/cheap model
  secondary: string   // suggested capable model
  tertiary:  string   // suggested optional third model
}

export const KNOWN_ENDPOINTS: Array<{ match: string | RegExp; info: DetectedProvider }> = [
  {
    match: 'api.openai.com',
    info:  { label: 'OpenAI', icon: '🟢', color: '#10a37f', primary: 'gpt-4o-mini', secondary: 'gpt-4o', tertiary: '' },
  },
  {
    match: 'api.anthropic.com',
    info:  { label: 'Anthropic (use native tab)', icon: '🟠', color: '#e07547', primary: 'claude-haiku-4-5-20251001', secondary: 'claude-sonnet-4-6', tertiary: 'claude-opus-4-6' },
  },
  {
    match: 'api.deepseek.com',
    info:  { label: 'DeepSeek', icon: '🔷', color: '#4d6bfe', primary: 'deepseek-chat', secondary: 'deepseek-reasoner', tertiary: '' },
  },
  {
    match: 'api.groq.com',
    info:  { label: 'Groq', icon: '⚡', color: '#f55036', primary: 'llama-3.1-8b-instant', secondary: 'llama-3.3-70b-versatile', tertiary: '' },
  },
  {
    match: 'api.together.xyz',
    info:  { label: 'Together AI', icon: '🤝', color: '#0ea5e9', primary: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', secondary: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', tertiary: '' },
  },
  {
    match: 'api.minimax.chat',
    info:  { label: 'MiniMax', icon: '🟣', color: '#7c3aed', primary: 'abab6.5s-chat', secondary: 'MiniMax-Text-01', tertiary: '' },
  },
  {
    match: 'api.mistral.ai',
    info:  { label: 'Mistral AI', icon: '🔴', color: '#f54e00', primary: 'mistral-small-latest', secondary: 'mistral-large-latest', tertiary: '' },
  },
  {
    match: 'generativelanguage.googleapis.com',
    info:  { label: 'Google Gemini', icon: '🔵', color: '#4285f4', primary: 'gemini-2.0-flash', secondary: 'gemini-1.5-pro', tertiary: '' },
  },
  {
    match: /localhost:11434/,
    info:  { label: 'Ollama (Local)', icon: '🦙', color: '#94a3b8', primary: 'llama3.2', secondary: 'llama3.3', tertiary: '' },
  },
  {
    match: /localhost:1234/,
    info:  { label: 'LM Studio (Local)', icon: '🖥️', color: '#a78bfa', primary: 'local-model', secondary: 'local-model', tertiary: '' },
  },
]

/** Detect provider from base URL. Returns null if no match. */
export function detectProviderFromUrl(url: string): DetectedProvider | null {
  if (!url.trim()) return null
  for (const entry of KNOWN_ENDPOINTS) {
    const match = typeof entry.match === 'string'
      ? url.includes(entry.match)
      : entry.match.test(url)
    if (match) return entry.info
  }
  return null
}

export const PROVIDER_DISPLAY_ORDER = ['anthropic', 'custom'] as const
