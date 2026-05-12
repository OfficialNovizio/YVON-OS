import { NextRequest, NextResponse } from 'next/server'
import { callFast } from '@/lib/ai-client'

export async function POST(req: NextRequest) {
  try {
    const { brandName, industry } = await req.json()

    if (!brandName) {
      return NextResponse.json({ error: 'brandName required' }, { status: 400 })
    }

    const raw = await callFast({
      messages: [{
        role: 'user',
        content: `You are a brand strategist. List the top 5 direct competitors for a brand called "${brandName}"${industry ? ` in the following space: ${industry}` : ''}.

Return ONLY a JSON array of brand name strings — no explanation, no markdown. Example format:
["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"]`,
      }],
      maxTokens: 256,
    })

    // Extract JSON array from response (handle any surrounding text)
    const match = raw.trim().match(/\[[\s\S]*?\]/)
    const competitors: string[] = match ? JSON.parse(match[0]) : []

    return NextResponse.json({ competitors })
  } catch (err) {
    console.error('[auto-competitors]', err)
    return NextResponse.json({ competitors: [], error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
