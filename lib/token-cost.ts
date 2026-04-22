// ── Claude model pricing (USD per million tokens) — March 2026 ────────────────
// Source: https://www.anthropic.com/pricing
// Update these when Anthropic changes pricing.

interface ModelPricing {
  inputPerM: number
  outputPerM: number
  cacheWritePerM: number
  cacheReadPerM: number
}

const PRICING: Record<string, ModelPricing> = {
  'claude-opus-4-6': {
    inputPerM:      15.00,
    outputPerM:     75.00,
    cacheWritePerM:  18.75,
    cacheReadPerM:    1.50,
  },
  'claude-sonnet-4-6': {
    inputPerM:       3.00,
    outputPerM:     15.00,
    cacheWritePerM:   3.75,
    cacheReadPerM:    0.30,
  },
  'claude-haiku-4-5-20251001': {
    inputPerM:       0.80,
    outputPerM:       4.00,
    cacheWritePerM:   1.00,
    cacheReadPerM:    0.08,
  },
}

// Default to Sonnet pricing for unknown models
const DEFAULT_PRICING = PRICING['claude-sonnet-4-6']

export function calcCostUsd(params: {
  model: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
}): number {
  const p = PRICING[params.model] ?? DEFAULT_PRICING
  const cost =
    (params.inputTokens            / 1_000_000) * p.inputPerM +
    (params.outputTokens           / 1_000_000) * p.outputPerM +
    ((params.cacheReadTokens ?? 0) / 1_000_000) * p.cacheReadPerM +
    ((params.cacheCreationTokens ?? 0) / 1_000_000) * p.cacheWritePerM
  return Math.round(cost * 1_000_000) / 1_000_000  // 6 decimal places
}

export function formatCost(usd: number): string {
  if (usd < 0.001) return `$${(usd * 100).toFixed(4)}¢`
  if (usd < 1)     return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

export function getModelDisplay(model: string): string {
  const map: Record<string, string> = {
    'claude-opus-4-6':           'Opus',
    'claude-sonnet-4-6':         'Sonnet',
    'claude-haiku-4-5-20251001': 'Haiku',
  }
  return map[model] ?? model.split('-').pop() ?? model
}
