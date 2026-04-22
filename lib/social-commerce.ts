// Social Commerce Bridge — Detects purchase-intent posts from content
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { getContentScores } from '@/lib/db-phase1'
import type { ContentScoreCard } from '@/lib/types'

export interface PurchaseIntentPost {
  postId: string
  platform: string
  captionPreview: string | undefined
  purchaseIntentScore: number
  productHints: string[]
  suggestedAction: string
}

export async function detectPurchaseIntentPosts(ventureId: string): Promise<PurchaseIntentPost[]> {
  if (!process.env.ANTHROPIC_API_KEY) return []
  const top = await getContentScores(ventureId, undefined, 50)
  if (top.length === 0) return []

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const captions = top.map((c) => ({ id: c.postId, platform: c.platform, caption: c.captionPreview }))
  const prompt = `Analyze these ${captions.length} social posts for purchase-intent signals.
CAPTIONS: ${JSON.stringify(captions)}
Return ONLY valid JSON for posts that show purchase intent (score >= 60):
[{ "postId": "match id", "platform": "match platform", "purchaseIntentScore": 60-100, "productHints": ["product 1"], "suggestedAction": "how to leverage" }]`

  try {
    const res = await client.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '[]'
    const parsed = JSON.parse(raw) as Array<{ postId: string; platform: string; purchaseIntentScore: number; productHints: string[]; suggestedAction: string }>

    const out: PurchaseIntentPost[] = []
    for (const r of parsed.filter((x) => x.purchaseIntentScore >= 60)) {
      const post = top.find((c) => c.postId === r.postId)
      if (post) out.push({ postId: r.postId, platform: r.platform, captionPreview: post.captionPreview, purchaseIntentScore: r.purchaseIntentScore, productHints: r.productHints, suggestedAction: r.suggestedAction })
    }
    return out
  } catch {
    return []
  }
}