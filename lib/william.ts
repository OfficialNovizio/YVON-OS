// William A/B Copy — generates A/B copy variants for social posts.
// Brand voice injection from venture settings. Falls back to mock
// when no API key is configured.
//
// Usage (server-only):
//   import { generateCopy } from '@/lib/william'
//   const { variants } = await generateCopy('Write a post about AI', brandVoice)

import 'server-only'
import { getSecret } from '@/lib/secrets'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BrandVoice {
  /** Venture/brand name */
  brand: string
  /** Tone descriptors (e.g. "confident, technical, bold") */
  tone: string
  /** Target audience */
  audience: string
  /** Dos and don'ts */
  guidelines?: string[]
}

export interface CopyVariant {
  text: string
  label: string
}

export interface GenerateCopyResult {
  variants: CopyVariant[]
  prompt: string
  brandVoice?: BrandVoice
  source: 'live' | 'mock'
}

// ── Mock copy generator ────────────────────────────────────────────────────────

const MOCK_TEMPLATES = [
  {
    label: 'A (Direct)',
    templates: [
      'I {action} {thing} for {time}. Here is exactly what {outcome}.',
      '{thing} changed how I {action}. A thread on what actually happened.',
      'Most people {mistake}. Here is why {insight}.',
    ],
  },
  {
    label: 'B (Curious)',
    templates: [
      'What if {thing} could {outcome}? I tested it for {time} — and the results surprised me.',
      'The one {thing} shift that {outcome}. (It is not what you think.)',
      'Everyone talks about {thing}. Nobody talks about {insight}.',
    ],
  },
]

const MOCK_ACTIONS = ['built', 'shipped', 'tested', 'ran', 'launched', 'automated']
const MOCK_THINGS = [
  'my marketing stack', 'AI agents', 'the content pipeline',
  'a design system', 'the decision queue', 'an email sequence',
]
const MOCK_TIMES = ['7 days', 'a weekend', '30 days', '2 weeks', 'a sprint']
const MOCK_OUTCOMES = [
  'shipped', 'broke', 'scaled', 'converted', 'went viral', 'failed',
]
const MOCK_MISTAKES = [
  'overthink their copy', 'chase trends', 'ignore data',
  'post without testing', 'skip the hook',
]
const MOCK_INSIGHTS = [
  'the hook is everything', 'consistency beats virality',
  'data picks the winner', 'voice matters more than format',
  'testing A/B unlocked 3x engagement',
]

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate A/B copy variants with optional brand voice injection.
 * Falls back to mock copy when no API key is configured.
 */
export async function generateCopy(
  prompt: string,
  brandVoice?: BrandVoice,
  count: number = 2
): Promise<GenerateCopyResult> {
  const apiKey =
    (await getSecret('ANTHROPIC_API_KEY')) ?? process.env.ANTHROPIC_API_KEY
  const openaiKey =
    (await getSecret('OPENAI_API_KEY')) ?? process.env.OPENAI_API_KEY

  if (!apiKey && !openaiKey) {
    return mockCopy(prompt, brandVoice, count)
  }

  try {
    const systemPrompt = buildSystemPrompt(brandVoice)
    const userPrompt = buildUserPrompt(prompt, count)

    // Try Anthropic first, fall back to OpenAI
    let rawText: string
    if (apiKey) {
      rawText = await callAnthropic(apiKey, systemPrompt, userPrompt)
    } else if (openaiKey) {
      rawText = await callOpenAI(openaiKey!, systemPrompt, userPrompt)
    } else {
      return mockCopy(prompt, brandVoice, count)
    }

    // Parse JSON response
    const variants = parseVariants(rawText, count)
    if (variants.length === 0) {
      return mockCopy(prompt, brandVoice, count)
    }

    return {
      variants,
      prompt,
      brandVoice,
      source: 'live',
    }
  } catch (err) {
    console.error('[william] generateCopy error:', err)
    return mockCopy(prompt, brandVoice, count)
  }
}

// ── LLM calls ──────────────────────────────────────────────────────────────────

async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    content?: Array<{ text?: string }>
  }
  return data.content?.[0]?.text ?? ''
}

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content ?? ''
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildSystemPrompt(brandVoice?: BrandVoice): string {
  let base =
    'You are William, an A/B copy specialist at YVON. You write social media copy variants ' +
    'that are punchy, scroll-stopping, and on-brand. Every variant must use a different ' +
    'hook angle. Keep each variant under 280 characters. Use sentence case, no hashtags, no emojis unless specified.'

  if (brandVoice) {
    base += `\n\nBrand: ${brandVoice.brand}`
    base += `\nTone: ${brandVoice.tone}`
    base += `\nAudience: ${brandVoice.audience}`
    if (brandVoice.guidelines?.length) {
      base += `\nGuidelines:\n${brandVoice.guidelines.map((g) => `- ${g}`).join('\n')}`
    }
  }

  return base
}

function buildUserPrompt(prompt: string, count: number): string {
  return (
    `Generate ${count} copy variants for the following post concept. ` +
    `Return ONLY a JSON array of objects with "text" and "label" fields. ` +
    `Label them "Variant A" and "Variant B". No other text.\n\n` +
    `Concept: ${prompt}`
  )
}

function parseVariants(raw: string, expectedCount: number): CopyVariant[] {
  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      text?: string
      label?: string
    }>
    return parsed
      .filter((v) => v.text && typeof v.text === 'string')
      .slice(0, expectedCount)
      .map((v, i) => ({
        text: v.text ?? '',
        label: v.label ?? `Variant ${String.fromCharCode(65 + i)}`,
      }))
  } catch {
    return []
  }
}

// ── Mock fallback ──────────────────────────────────────────────────────────────

function mockCopy(
  prompt: string,
  brandVoice?: BrandVoice,
  count: number = 2
): GenerateCopyResult {
  const action = pickRandom(MOCK_ACTIONS)
  const thing = pickRandom(MOCK_THINGS)
  const time = pickRandom(MOCK_TIMES)
  const outcome = pickRandom(MOCK_OUTCOMES)
  const mistake = pickRandom(MOCK_MISTAKES)
  const insight = pickRandom(MOCK_INSIGHTS)

  const variants: CopyVariant[] = MOCK_TEMPLATES.slice(0, Math.min(count, 2)).map(
    (tpl) => {
      const template = pickRandom(tpl.templates)
      const text = template
        .replace('{action}', action)
        .replace('{thing}', thing)
        .replace('{time}', time)
        .replace('{outcome}', outcome)
        .replace('{mistake}', mistake)
        .replace('{insight}', insight)

      return { text, label: tpl.label }
    }
  )

  return {
    variants,
    prompt,
    brandVoice,
    source: 'mock',
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
