// Krea AI — visual generation integration
// Generates images via Krea AI API and attaches assets to campaign cards

import 'server-only'

const KREA_BASE = 'https://api.krea.ai/v1'
const KREA_KEY = process.env.KREA_API_KEY ?? ''

export interface KreaGenerationRequest {
  prompt: string
  negativePrompt?: string
  style?: 'photorealistic' | 'illustration' | 'minimal' | '3d' | 'abstract'
  width?: number
  height?: number
  count?: number
}

export interface KreaGenerationResponse {
  imageUrl: string
  promptUsed: string
  style: string
  dimensions: string
  generatedAt: string
}

export async function generateWithKrea(
  req: KreaGenerationRequest
): Promise<KreaGenerationResponse[]> {
  if (!KREA_KEY) {
    throw new Error('KREA_API_KEY not set — apply for Krea AI API access')
  }

  const response = await fetch(`${KREA_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KREA_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: req.prompt,
      negative_prompt: req.negativePrompt ?? '',
      width: req.width ?? 1080,
      height: req.height ?? 1080,
      num_outputs: req.count ?? 1,
      model: 'krea-v2',
    }),
  })

  if (!response.ok) {
    throw new Error(`Krea AI: ${response.status}`)
  }

  const data = await response.json() as { results?: Array<{ url?: string }> }
  return (data.results ?? []).map((r) => ({
    imageUrl: r.url ?? '',
    promptUsed: req.prompt,
    style: req.style ?? 'photorealistic',
    dimensions: `${req.width ?? 1080}x${req.height ?? 1080}`,
    generatedAt: new Date().toISOString(),
  }))
}
