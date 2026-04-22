// Campaign Builder — full 9-stage flow
// POST: Runs a stage of the campaign builder pipeline
// Stages: ideas → scripts → captions → voiceover → image_prompts → krea_generate

import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface CampaignBrief {
  goal: string
  product: string
  targetEmotion: string
  platform: string
  brandVoice?: string
  ventureName?: string
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: {
    stage: 'ideas' | 'scripts' | 'captions' | 'voiceover' | 'image_prompts'
    brief: CampaignBrief
    selectedIdea?: string
    script?: string
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureName = body.brief.ventureName ?? 'Novizio'
  const brandVoice = body.brief.brandVoice ?? 'confident, innovative, action-oriented'

  const prompts: Record<string, string> = {
    ideas: generateIdeasPrompt(body.brief, ventureName, brandVoice),
    scripts: generateScriptsPrompt(body.brief, body.selectedIdea ?? '', ventureName),
    captions: generateCaptionsPrompt(body.brief, body.selectedIdea ?? '', ventureName, brandVoice),
    voiceover: generateVoiceoverPrompt(body.brief, body.selectedIdea ?? '', body.script ?? ''),
    image_prompts: generateImagePrompts(body.brief, body.selectedIdea ?? '', ventureName),
  }

  const prompt = prompts[body.stage]
  if (!prompt) {
    return Response.json({ error: `Unknown stage: ${body.stage}` }, { status: 400 })
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    return Response.json({ stage: body.stage, result: raw })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

function generateIdeasPrompt(brief: CampaignBrief, ventureName: string, brandVoice: string): string {
  return `You are a campaign strategist for ${ventureName}. Brand voice: ${brandVoice}.

Brief:
- Goal: ${brief.goal}
- Product: ${brief.product}
- Target emotion: ${brief.targetEmotion}
- Platform: ${brief.platform}

Generate exactly 5 content concepts. Each should have a different hook/angle.
Return ONLY valid JSON array:
[{
  "title": "content title",
  "hook": "attention-grabbing hook",
  "format": "reel/carousel/post/story",
  "angle": "why this works",
  "expectedImpact": "high/medium/low"
}]`
}

function generateScriptsPrompt(brief: CampaignBrief, selectedIdea: string, ventureName: string): string {
  return `You are a scriptwriter for ${ventureName}.

Selected concept: ${selectedIdea}
Goal: ${brief.goal}
Platform: ${brief.platform}

Write a complete platform-specific script with:
- Scene-by-scene directions
- Timing for each scene
- Spoken copy (if applicable)
- Visual direction
- Text overlay suggestions

Return ONLY valid JSON:
{
  "scenes": [{"scene": number, "duration": "3s", "direction": "...", "copy": "...", "overlay": "..."}],
  "totalDuration": "15s",
  "notes": "production notes"
}`
}

function generateCaptionsPrompt(brief: CampaignBrief, selectedIdea: string, ventureName: string, brandVoice: string): string {
  return `Write a caption for ${ventureName}. Brand voice: ${brandVoice}.

Concept: ${selectedIdea}
Platform: ${brief.platform}

Return ONLY valid JSON:
{
  "caption": "full ready-to-post caption with emojis",
  "hashtags": ["#hashtag1", ...],
  "cta": "call to action"
}`
}

function generateVoiceoverPrompt(brief: CampaignBrief, selectedIdea: string, script: string): string {
  return `Convert this script into a voiceover brief for ElevenLabs.

Concept: ${selectedIdea}
Target emotion: ${brief.targetEmotion}

Script:
${script}

Return ONLY valid JSON:
{
  "voiceStyle": "calm/energetic/authoritative/friendly",
  "voiceClone": "voice ID suggestion for ElevenLabs",
  "pacing": "slow/medium/fast",
  "sections": [{"text": "...", "tone": "...", "pause_ms": 500}]
}`
}

function generateImagePrompts(brief: CampaignBrief, selectedIdea: string, ventureName: string): string {
  return `Create visual prompts for Krea AI for a ${brief.platform} campaign.

Concept: ${selectedIdea}
Brand: ${ventureName}

Generate 3-5 visual prompts optimized for Krea AI generation.
Return ONLY valid JSON:
{
  "prompts": [
    {
      "title": "scene name",
      "prompt": "detailed visual prompt for Krea AI",
      "negative_prompt": "what to avoid",
      "style": "photorealistic/illustration/minimal/etc",
      "dimensions": "1080x1080"
    }
  ]
}`
}
