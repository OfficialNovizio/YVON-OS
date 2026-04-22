// ElevenLabs — voiceover generation integration
// Generates voiceover audio from campaign scripts via ElevenLabs API

import 'server-only'

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY ?? ''

export interface ElevenLabsGenerationToken {
  text: string
  voiceId?: string
  model?: string
  voiceStyle?: string
  stability?: number
  similarity?: number
}

export interface ElevenLabsGenerationResponse {
  audioUrl: string
  voiceUsed: string
  model: string
  duration: string
  generatedAt: string
}

export async function generateVoiceover(
  token: ElevenLabsGenerationToken
): Promise<ElevenLabsGenerationResponse> {
  if (!ELEVENLABS_KEY) {
    throw new Error('ELEVENLABS_API_KEY not set')
  }

  const voiceId = token.voiceId ?? '21m00Tcm4TlvDq8ikWAM' // Default: Rachel
  const model = token.model ?? 'eleven_multilingual_v2'

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: token.text,
      model_id: model,
      voice_settings: {
        stability: token.stability ?? 0.5,
        similarity_boost: token.similarity ?? 0.8,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs: ${response.status}`)
  }

  // ElevenLabs returns audio bytes — in production, upload to Supabase Storage
  // For now, return a placeholder URL
  const audioBlob = await response.blob()
  const audioUrl = `data:${audioBlob.type};base64,placeholder`

  return {
    audioUrl,
    voiceUsed: voiceId,
    model,
    duration: 'placeholder',
    generatedAt: new Date().toISOString(),
  }
}
