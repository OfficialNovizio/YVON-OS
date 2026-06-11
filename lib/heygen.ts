// HeyGen Voice — speech generation for Advisory Council agents.
// Each council agent gets a distinct voice. Falls back to mock audio
// when HEYGEN_API_KEY is not configured.
//
// Usage (server-only):
//   import { generateSpeech, getVoices } from '@/lib/heygen'
//   const { audioUrl } = await generateSpeech('Hello world', 'henry')

import 'server-only'
import { getSecret } from '@/lib/secrets'

const HEYGEN_BASE = 'https://api.heygen.com'

// ── Voice definitions ──────────────────────────────────────────────────────────

export interface HeygenVoice {
  id: string
  name: string
  agent: string
  gender: 'male' | 'female'
  /** Emoji or short label for the voice profile */
  label: string
  /** Hex color matching the council avatar */
  color: string
}

const COUNCIL_VOICES: HeygenVoice[] = [
  {
    id: 'henry',
    name: 'Henry',
    agent: 'Henry · Filter + Gatekeeper',
    gender: 'male',
    label: '🎙️ Calm baritone',
    color: '#abc7ff',
  },
  {
    id: 'nexus',
    name: 'Nexus',
    agent: 'Nexus · Ops + Architecture',
    gender: 'male',
    label: '🎙️ Crisp tenor',
    color: '#5ee0ff',
  },
  {
    id: 'strategist',
    name: 'Strategist',
    agent: 'Strategist · Strategy + Positioning',
    gender: 'female',
    label: '🎙️ Warm alto',
    color: '#ffb693',
  },
  {
    id: 'william',
    name: 'William',
    agent: 'William · Copy + A/B Testing',
    gender: 'male',
    label: '🎙️ Confident mid',
    color: '#c08bff',
  },
  {
    id: 'leonardo',
    name: 'Leonardo',
    agent: 'Leonardo · Image Generation',
    gender: 'male',
    label: '🎙️ Deep resonant',
    color: '#5fd0b4',
  },
]

// ── Public API ─────────────────────────────────────────────────────────────────

export interface GenerateSpeechResult {
  audioUrl: string
  durationMs: number
  voiceId: string
  source: 'heygen' | 'mock'
}

/**
 * Generate speech audio from text using a council agent's voice.
 * Falls back to mock audio URL when no HEYGEN_API_KEY is configured.
 */
export async function generateSpeech(
  text: string,
  voiceId: string
): Promise<GenerateSpeechResult> {
  const voice = COUNCIL_VOICES.find((v) => v.id === voiceId)
  if (!voice) {
    throw new Error(
      `Unknown voiceId "${voiceId}". Available: ${COUNCIL_VOICES.map((v) => v.id).join(', ')}`
    )
  }

  const apiKey = (await getSecret('HEYGEN_API_KEY')) ?? process.env.HEYGEN_API_KEY
  if (!apiKey) {
    return mockSpeech(text, voice)
  }

  try {
    // HeyGen TTS v1 endpoint
    const res = await fetch(`${HEYGEN_BASE}/v1/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        // Use HeyGen's built-in voice mappings via voice name
        voice_name: voice.name,
        format: 'mp3',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error(`[heygen] TTS failed (${res.status}):`, errBody)
      return mockSpeech(text, voice)
    }

    const data = (await res.json()) as {
      audio_url?: string
      duration?: number
      url?: string
    }

    const audioUrl = data.audio_url ?? data.url ?? ''
    const durationMs = (data.duration ?? estimateDuration(text)) * 1000

    return { audioUrl, durationMs, voiceId: voice.id, source: 'heygen' }
  } catch (err) {
    console.error('[heygen] generateSpeech error:', err)
    return mockSpeech(text, voice)
  }
}

/** Return available council voices. */
export function getVoices(): HeygenVoice[] {
  return COUNCIL_VOICES
}

/** Look up a single voice by id. */
export function getVoice(voiceId: string): HeygenVoice | undefined {
  return COUNCIL_VOICES.find((v) => v.id === voiceId)
}

// ── Mock fallback ──────────────────────────────────────────────────────────────

function mockSpeech(text: string, voice: HeygenVoice): GenerateSpeechResult {
  // Use a free sample audio URL so the player actually produces sound in dev
  const mockUrls = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  ]
  const idx =
    COUNCIL_VOICES.findIndex((v) => v.id === voice.id) % mockUrls.length
  const durationMs = estimateDuration(text)
  return {
    audioUrl: mockUrls[idx],
    durationMs,
    voiceId: voice.id,
    source: 'mock',
  }
}

function estimateDuration(text: string): number {
  // Rough: ~150 words/min → 2.5 words/sec. Average word ~5 chars.
  const words = text.split(/\s+/).length
  return Math.max(2000, Math.round((words / 2.5) * 1000))
}
