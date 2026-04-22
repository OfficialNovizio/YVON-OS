// Archive Intelligence — cross-reference old content with current trends
// Resurrects relevant old content that align with emerging trends
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getTopContent, getContentScores } from '@/lib/db-phase1'
import type { ContentScoreCard } from '@/lib/types'

export async function getArchiveRecommendations(ventureId: string, currentTrends: string[], limit = 5): Promise<Array<{ post: ContentScoreCard; whyResurface: string; newAngle: string; suggestedPlatform: string }>> {
  if (!process.env.ANTHROPIC_API_KEY) return []
  const scores = await getContentScores(ventureId, undefined, Math.max(limit * 5, 20))
  if (scores.length === 0) return []

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const prompt = `You are an archive intelligence engine. Match old content with current trends to find resurface opportunities.

OLD CONTENT (already performed well):
${JSON.stringify(scores.slice(0, Math.min(limit * 2, 20)), null, 2)}

CURRENT TRENDS:
${currentTrends.join(', ')}

For each of the top ${limit} old posts that aligns with a current trend, return:
- why it should be resurfaced
- what angle to take this time (fresh spin)
- which platform to target this time

Return ONLY valid JSON array:
[{
  "postId": "match the postId from the old content above",
  "whyResurface": "why this old content aligns with current trends",
  "newAngle": "fresh angle to take — not just repost the same thing",
  "suggestedPlatform": "instagram, linkedin, tiktok, or youtube"
}]`

  try {
    const response = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const matches = JSON.parse(raw) as Array<Record<string, string>>

    const results: Array<{ post: ContentScoreCard; whyResurface: string; newAngle: string; suggestedPlatform: string }> = []
    for (const m of matches) {
      const post = scores.find((s) => s.postId === m.postId)
      if (post) results.push({ post, whyResurface: m.whyResurface ?? '', newAngle: m.newAngle ?? '', suggestedPlatform: m.suggestedPlatform ?? scores[0].platform })
    }
    return results
  } catch { return [] }
}
