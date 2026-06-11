// Leonardo AI — image generation for Asset Lab.
// Generates images via Leonardo API with brand kit adherence.
// Generates 8 images per post batch. Falls back to mock when
// LEONARDO_API_KEY is not configured.
//
// Usage (server-only):
//   import { generateImage, generateBatch } from '@/lib/leonardo'
//   const images = await generateBatch(prompts, brandKit)

import 'server-only'
import { getSecret } from '@/lib/secrets'

const LEONARDO_BASE = 'https://cloud.leonardo.ai/api/rest/v1'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BrandKit {
  style: string
  ratios: string
  persona: string
  colors: string[]
}

export interface LeonardoImage {
  url: string
  id: string
  prompt: string
  width: number
  height: number
  generatedAt: string
  source: 'leonardo' | 'mock'
}

export interface GenerateOptions {
  width?: number
  height?: number
  count?: number
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate a single image with brand kit adherence.
 * The brand kit colors and style are injected into the prompt automatically.
 */
export async function generateImage(
  prompt: string,
  brandKit?: BrandKit,
  options?: GenerateOptions
): Promise<LeonardoImage> {
  const enriched = enrichPrompt(prompt, brandKit)
  const apiKey = (await getSecret('LEONARDO_API_KEY')) ?? process.env.LEONARDO_API_KEY

  if (!apiKey) {
    return mockImage(enriched, options)
  }

  try {
    const width = options?.width ?? 1080
    const height = options?.height ?? 1080

    // Step 1: Create generation
    const genRes = await fetch(`${LEONARDO_BASE}/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enriched,
        width,
        height,
        num_images: 1,
        modelId: '6bef9f1b-29cb-40c7-b9df-32b51c1f67d3', // Leonardo Creative
        presetStyle: 'DYNAMIC',
      }),
    })

    if (!genRes.ok) {
      console.error(`[leonardo] generation failed (${genRes.status})`)
      return mockImage(enriched, options)
    }

    const genData = (await genRes.json()) as {
      sdGenerationJob?: { generationId: string }
    }
    const generationId = genData.sdGenerationJob?.generationId
    if (!generationId) return mockImage(enriched, options)

    // Step 2: Poll for result (up to 30s)
    const imageUrl = await pollGeneration(generationId, apiKey)
    if (!imageUrl) return mockImage(enriched, options)

    return {
      url: imageUrl,
      id: generationId,
      prompt: enriched,
      width,
      height,
      generatedAt: new Date().toISOString(),
      source: 'leonardo',
    }
  } catch (err) {
    console.error('[leonardo] generateImage error:', err)
    return mockImage(enriched, options)
  }
}

/**
 * Generate a batch of 8 images for a social post.
 * Each prompt in the array gets its own image.
 */
export async function generateBatch(
  prompts: string[],
  brandKit?: BrandKit
): Promise<LeonardoImage[]> {
  // Cap at 8
  const batch = prompts.slice(0, 8)
  const results = await Promise.allSettled(
    batch.map((prompt) => generateImage(prompt, brandKit))
  )
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return mockImage(batch[i], { width: 1080, height: 1080 })
  })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function enrichPrompt(prompt: string, brandKit?: BrandKit): string {
  if (!brandKit) return prompt

  const parts: string[] = [prompt]

  if (brandKit.style) {
    parts.push(`in a ${brandKit.style} style`)
  }
  if (brandKit.colors?.length) {
    const colorDesc = brandKit.colors
      .map((c) => c)
      .join(', ')
    parts.push(`using brand colors: ${colorDesc}`)
  }
  if (brandKit.persona) {
    parts.push(`matching the ${brandKit.persona} brand persona`)
  }

  return parts.join(', ')
}

async function pollGeneration(
  generationId: string,
  apiKey: string
): Promise<string | null> {
  const maxAttempts = 15
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000)
    const res = await fetch(
      `${LEONARDO_BASE}/generations/${generationId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      generations_by_pk?: {
        status?: string
        generated_images?: Array<{ url?: string }>
      }
    }

    const gen = data.generations_by_pk
    if (gen?.status === 'COMPLETE') {
      const url = gen.generated_images?.[0]?.url
      return url ?? null
    }
    if (gen?.status === 'FAILED') return null
  }
  return null // timeout
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ── Mock fallback ──────────────────────────────────────────────────────────────

const MOCK_COLORS = [
  '#6d5bd0', '#1f6f5c', '#7a3b8f', '#b5532a',
  '#274b78', '#9a7b2e', '#2e7d6b', '#823f3f',
]

function mockImage(
  prompt: string,
  options?: GenerateOptions
): LeonardoImage {
  const width = options?.width ?? 1080
  const height = options?.height ?? 1080
  const color = MOCK_COLORS[Math.floor(Math.random() * MOCK_COLORS.length)]
  // Use picsum for realistic placeholder images
  const seed = Math.floor(Math.random() * 1000)
  return {
    url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    id: `mock-${crypto.randomUUID()}`,
    prompt,
    width,
    height,
    generatedAt: new Date().toISOString(),
    source: 'mock',
  }
}
