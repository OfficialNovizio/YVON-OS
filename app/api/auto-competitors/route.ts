import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { brandName, industry } = await req.json()

    if (!brandName) {
      return NextResponse.json({ error: 'brandName required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a brand strategist. List the top 5 direct competitors for a brand called "${brandName}"${industry ? ` in the following space: ${industry}` : ''}.

Return ONLY a JSON array of brand name strings — no explanation, no markdown. Example format:
["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"]`,
        },
      ],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '[]'

    // Extract JSON array from response (handle any surrounding text)
    const match = raw.match(/\[[\s\S]*?\]/)
    const competitors: string[] = match ? JSON.parse(match[0]) : []

    return NextResponse.json({ competitors })
  } catch (err) {
    console.error('[auto-competitors]', err)
    return NextResponse.json({ competitors: [], error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
