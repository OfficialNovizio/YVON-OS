// POST /api/william/copy
// William A/B Copy — generates A/B copy variants for social posts.
// Brand voice injected from venture settings. Falls back to mock.
//
// Request:  { prompt: string, brandVoice?: BrandVoice, count?: number }
// Response: { variants: CopyVariant[], prompt, brandVoice, source }

import { NextResponse } from 'next/server'
import { generateCopy } from '@/lib/william'
import type { BrandVoice } from '@/lib/william'

export const runtime = 'nodejs'

interface CopyRequest {
  prompt?: string
  brandVoice?: BrandVoice
  count?: number
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: CopyRequest
    try {
      body = (await request.json()) as CopyRequest
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { prompt, brandVoice, count } = body

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty "prompt" field' },
        { status: 400 }
      )
    }

    const numVariants = Math.min(Math.max(count ?? 2, 1), 4)
    const result = await generateCopy(prompt.trim(), brandVoice, numVariants)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[william/copy POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
