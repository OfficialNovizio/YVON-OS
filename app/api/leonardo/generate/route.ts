// POST /api/leonardo/generate
// Generates images via Leonardo AI with brand kit adherence.
// Falls back to mock when LEONARDO_API_KEY is not configured.
//
// Request:  { prompt: string, brandKit?: BrandKit, count?: number }
// Response: { images: LeonardoImage[] }

import { NextResponse } from 'next/server'
import { generateImage, generateBatch } from '@/lib/leonardo'
import type { BrandKit } from '@/lib/leonardo'

export const runtime = 'nodejs'

interface GenerateRequest {
  prompt?: string
  prompts?: string[]
  brandKit?: BrandKit
  count?: number
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: GenerateRequest
    try {
      body = (await request.json()) as GenerateRequest
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { prompt, prompts, brandKit, count } = body

    // Batch mode: array of prompts
    if (prompts && Array.isArray(prompts) && prompts.length > 0) {
      const images = await generateBatch(prompts, brandKit)
      return NextResponse.json({ images })
    }

    // Single prompt mode
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty "prompt" field (or "prompts" array)' },
        { status: 400 }
      )
    }

    const numImages = Math.min(count ?? 1, 8)

    if (numImages === 1) {
      const image = await generateImage(prompt.trim(), brandKit)
      return NextResponse.json({ images: [image] })
    }

    // Multiple images from single prompt
    const promptsArr = Array.from({ length: numImages }, () => prompt.trim())
    const images = await generateBatch(promptsArr, brandKit)
    return NextResponse.json({ images })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[leonardo/generate POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
