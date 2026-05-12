// Content Flywheel API — Identify → Mutate → Deploy → Learn → Compound
// POST: generates 8 variants from a top-performing post
import { cookies } from 'next/headers'
import { callSynthesis } from '@/lib/ai-client'
import { getTopContent } from '@/lib/db-phase1'
import { supabase } from '@/lib/supabase'
import type { ContentScoreCard } from '@/lib/types'

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  let body: { postId?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // If no specific post ID, pick the top-scoring post
  const topPosts = await getTopContent(ventureId, 1)
  let topItem: ContentScoreCard | null = topPosts[0] ?? null

  if (!topItem && body.postId) {
    const { data } = await supabase.from('content_scores').select('*').eq('venture_id', ventureId).eq('post_id', body.postId).single()
    if (data) {
      topItem = {
        id: data.id,
        ventureId: data.venture_id,
        platform: data.platform,
        postId: data.post_id,
        captionPreview: data.caption_preview,
        reach: data.reach ?? 0,
        likes: data.likes ?? 0,
        comments: data.comments ?? 0,
        saves: data.saves ?? 0,
        shares: data.shares ?? 0,
        compositeScore: data.composite_score ?? 0,
        engagementRate: 0,
        saveRate: 0,
        shareRate: 0,
        postDate: data.post_date,
      } as ContentScoreCard
    }
  }

  if (!topItem) {
    return Response.json({ error: 'No top content available — publish some content first' }, { status: 404 })
  }

  const prompt = `You are a content mutation engine. Take this top-performing post and create 8 variants with different hooks but the same core idea.

ORIGINAL:
- Platform: ${topItem.platform}
- Caption: ${topItem.captionPreview ?? 'N/A'}
- Reach: ${topItem.reach} | Saves: ${topItem.saves} | Shares: ${topItem.shares} | Comments: ${topItem.comments}

Generate 8 variants — mutate the hook, keep the core idea. Optimize each for a specific platform.

Return ONLY valid JSON:
{
  "whyItWorked": ["insight 1", "insight 2", "insight 3"],
  "variants": [
    {"platform": "instagram", "hook": "...", "caption": "...", "format": "reel", "hashtagCluster": ["#", "#"]},
    {"platform": "linkedin", "hook": "...", "caption": "...", "format": "post", "hashtagCluster": ["#", "#"]},
    {"platform": "tiktok", "hook": "...", "caption": "...", "format": "short", "hashtagCluster": ["#", "#"]},
    {"platform": "youtube", "hook": "...", "caption": "...", "format": "short", "hashtagCluster": ["#", "#"]},
    {"platform": "twitter", "hook": "...", "caption": "...", "format": "thread", "hashtagCluster": []},
    {"platform": "facebook", "hook": "...", "caption": "...", "format": "post", "hashtagCluster": ["#", "#"]},
    {"platform": "pinterest", "hook": "...", "caption": "...", "format": "pin", "hashtagCluster": ["#", "#"]},
    {"platform": "reddit", "hook": "...", "caption": "...", "format": "post", "hashtagCluster": []}
  ],
  "learnings": "what templates to apply going forward"
}`

  try {
    const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 4000 })
    const parsed = JSON.parse(raw) as { variants: Array<{ platform: string; hook: string; caption: string; format: string; hashtagCluster: string[] }>; whyItWorked: string[]; learnings: string }

    await supabase.from('content_variants').upsert(
      parsed.variants.map((v) => ({
        venture_id: ventureId,
        original_post_id: topItem?.postId ?? body.postId ?? '',
        platform: v.platform,
        hook: v.hook,
        caption: v.caption,
        format: v.format,
        hashtags: v.hashtagCluster,
        status: 'pending',
      })),
      { onConflict: 'venture_id,original_post_id,platform' }
    )

    return Response.json({ postId: topItem?.postId, platform: topItem?.platform, variants: parsed.variants, whyItWorked: parsed.whyItWorked, learnings: parsed.learnings })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
