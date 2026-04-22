import Anthropic from '@anthropic-ai/sdk'
import { createContentSuggestion } from '@/lib/db'
import { logActivity } from '@/lib/activity'
import { getAgent } from '@/lib/agents'
import type { ContentType } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: { platform?: string; contentType?: string; topic?: string; ventureId?: string; ventureName?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    platform = 'instagram',
    contentType = 'reel',
    topic = '',
    ventureId = 'novizio',
    ventureName = 'Novizio',
  } = body

  // Pick agents based on platform
  // LinkedIn: Lena writes copy, Sofia handles platform tactics
  // Instagram: Lena + Sofia (same pairing, platform-native focus)
  const primaryAgent   = getAgent('lena-brand')
  const secondaryAgent = getAgent('sofia-social')

  const systemCtx = [primaryAgent?.systemPrompt, secondaryAgent?.systemPrompt]
    .filter(Boolean)
    .join('\n\n')

  const prompt = `You are a senior content strategist for ${ventureName}.

${systemCtx}

Generate a complete ${platform} ${contentType} content package for the following topic:
"${topic || 'our brand story'}"

Return a JSON object with these exact keys:
{
  "caption": "the full post caption with line breaks",
  "hook": "one powerful opening hook line",
  "hookVariants": ["variant 1", "variant 2", "variant 3"],
  "hashtags": [
    ["broad hashtag 1", "broad hashtag 2", "broad hashtag 3"],
    ["mid hashtag 1", "mid hashtag 2", "mid hashtag 3"],
    ["niche hashtag 1", "niche hashtag 2", "niche hashtag 3"]
  ],
  "audioSuggestion": "suggested trending audio or music style (for reels only, otherwise null)"
}

Return ONLY valid JSON, no markdown, no explanation.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return Response.json({ error: 'AI returned invalid JSON', raw }, { status: 502 })
    }

    const suggestion = await createContentSuggestion({
      ventureId,
      platform: platform as 'instagram' | 'linkedin',
      contentType: contentType as ContentType,
      topic: topic || undefined,
      caption: parsed.caption as string | undefined,
      hashtags: parsed.hashtags as string[][] | undefined,
      audioSuggestion: parsed.audioSuggestion as string | undefined,
      hook: parsed.hook as string | undefined,
      hookVariants: parsed.hookVariants as string[] | undefined,
    })

    await logActivity({
      ventureId,
      agentId: 'lena-brand',
      type: 'content_generated',
      message: `Generated ${platform} ${contentType}: "${topic || 'brand content'}"`,
      metadata: { contentId: suggestion.id, platform, contentType },
    })

    return Response.json({ ...parsed, id: suggestion.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
