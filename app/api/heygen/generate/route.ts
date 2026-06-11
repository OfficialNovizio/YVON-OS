// POST /api/heygen/generate
// Generates speech audio from text using a council agent's HeyGen voice.
// Falls back to mock audio when HEYGEN_API_KEY is not configured.
//
// Request:  { text: string, voiceId: string }
// Response: { audioUrl: string, durationMs: number, voiceId: string, source: 'heygen' | 'mock' }

import { NextResponse } from 'next/server'
import { generateSpeech, getVoices } from '@/lib/heygen'

export const runtime = 'nodejs'

interface GenerateRequest {
  text?: string
  voiceId?: string
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

    const { text, voiceId } = body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { error: 'Missing or empty "text" field' },
        { status: 400 }
      )
    }

    if (!voiceId || typeof voiceId !== 'string') {
      return NextResponse.json(
        {
          error: `Missing "voiceId". Available voices: ${getVoices()
            .map((v) => v.id)
            .join(', ')}`,
        },
        { status: 400 }
      )
    }

    const result = await generateSpeech(text.trim(), voiceId)
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[heygen/generate POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
