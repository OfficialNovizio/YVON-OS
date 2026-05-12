// Content Multiplier — takes top content → generates 8 platform variants
// Same core idea, different hook, format, and platform optimization

import 'server-only'
import { callSynthesis } from '@/lib/ai-client'

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

  const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 4000 })
  return JSON.parse(raw) as ContentMultiplierVariant[]
}
