// Content Multiplier — takes top content → generates 8 platform variants
// Same core idea, different hook, format, and platform optimization

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

export interface ContentMultiplierVariant {
  platform: string
  format: string
  hook: string
  caption: string
  hashtags: string[]
  cta: string
  bestTimeToPost: string
}

export async function generateVariants(
  topContent: { caption: string; hook: string; topic: string },
  platforms = ['instagram', 'linkedin', 'tiktok', 'youtube', 'twitter', 'facebook', 'pinterest', 'reddit']
): Promise<ContentMultiplierVariant[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a content multiplier engine. Take this top-performing content and create 8 platform-optimized variants.

CORE CONTENT:
- Hook: ${topContent.hook}
- Caption: ${topContent.caption}
- Topic: ${topContent.topic}

Generate 8 variants — one for each of these platforms: ${platforms.join(', ')}.
Each variant must have a DIFFERENT hook but the SAME core idea.
Optimize format, length, and CTA for each platform's norms.

Return ONLY valid JSON array:
[{
  "platform": platform name,
  "format": "reel/carousel/post/thread/video",
  "hook": "new hook for this platform",
  "caption": "full caption",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "cta": "platform-appropriate CTA",
  "bestTimeToPost": "e.g. Tuesday 9am EST"
}]`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
  return JSON.parse(raw) as ContentMultiplierVariant[]
}
