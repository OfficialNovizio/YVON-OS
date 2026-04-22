// Creator & Influence Engine — rising micro-creators discovery
// POST: discovers rising micro-creators (5K-50K) in niche

import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

interface CreatorProfile {
  name: string
  handle: string
  platform: string
  followerCount: number
  engagementRate: number
  niche: string
  collaborationScore: number
  outreachBrief: string
  url: string
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  let body: { niche?: string; currentCreators?: string[] }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a creator discovery engine. Find 10 rising micro-creators (5K-50K followers) in the "${body.niche ?? 'this'}" niche who would be valuable collaboration partners.

Exclude these existing creators: ${(body.currentCreators ?? []).join(', ') || 'none'}

For each creator, provide:
- Their handle and platform
- Estimated follower count and engagement rate
- What makes them a good partnership
- A brief outreach message

Return ONLY valid JSON array:
[{
  "name": "creator name",
  "handle": "@handle",
  "platform": "instagram/youtube/tiktok/reddit",
  "followerCount": 25000,
  "engagementRate": 0.045,
  "niche": "their niche",
  "collaborationScore": 75.5,
  "outreachBrief": "personalized outreach message",
  "url": "their profile URL"
}]`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = response.content[0]?.type === 'text' ? response.content[0].text : '[]'
    const creators = JSON.parse(raw) as CreatorProfile[]

    // Save to creator_profiles table
    await supabase.from('creator_profiles').upsert(
      creators.map((c) => ({
        venture_id: ventureId,
        name: c.name,
        handle: c.handle,
        platform: c.platform,
        follower_count: c.followerCount ?? 0,
        engagement_rate: c.engagementRate ?? 0,
        niche: c.niche ?? '',
        collaboration_score: c.collaborationScore ?? 0,
        outreach_brief: c.outreachBrief ?? '',
        url: c.url ?? '',
        status: 'discovered',
      })),
      { onConflict: 'venture_id,name,platform' }
    )

    return Response.json({ creators, count: creators.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// GET /api/creator-engine
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { data } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('venture_id', ventureId)
    .order('collaboration_score', { ascending: false })
    .limit(50)

  return Response.json({ creators: data ?? [], count: data?.length ?? 0 })
}
