// POST /api/krea-generate — Generate visuals via Krea AI
// Accepts campaign asset prompts and returns generated images

import { generateWithKrea } from '@/lib/krea'
import { getSecret } from '@/lib/secrets'

export async function POST(request: Request): Promise<Response> {
  if (!(await getSecret('KREA_API_KEY'))) {
    return Response.json({ error: 'KREA_API_KEY not set — apply for access' }, { status: 500 })
  }

  let body: { prompts: Array<{ prompt: string; negativePrompt?: string; style?: string; width?: number; height?: number }> }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.prompts) || body.prompts.length === 0) {
    return Response.json({ error: 'prompts array required' }, { status: 400 })
  }

  const results: Array<Awaited<ReturnType<typeof generateWithKrea>>[number]> = []
  for (const p of body.prompts) {
    try {
      const generated = await generateWithKrea({
        prompt: p.prompt,
        negativePrompt: p.negativePrompt,
        style: (p.style as 'photorealistic' | 'illustration' | 'minimal' | '3d' | 'abstract') ?? 'photorealistic',
        width: p.width ?? 1080,
        height: p.height ?? 1080,
      })
        results.push(...generated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ imageUrl: `error_${msg}`, promptUsed: p.prompt, style: 'error', dimensions: '0x0', generatedAt: new Date().toISOString() })
    }
  }

  return Response.json({ total: results.length, results })
}
