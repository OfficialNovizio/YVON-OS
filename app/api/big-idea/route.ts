// Big Idea API — GET + PATCH brand_big_idea for the active venture
// Also exposes POST /generate to AI-draft answers from existing brand data

import { cookies } from 'next/headers'
import { getBigIdea, saveBigIdea } from '@/lib/big-idea'
import { callFast } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'
import type { BrandBigIdea } from '@/lib/types'

export const maxDuration = 30

async function getVentureId(): Promise<string> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const { data } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  return (data?.id as string | undefined) ?? slug
}

export async function GET(): Promise<Response> {
  const ventureId = await getVentureId()
  const idea = await getBigIdea(ventureId)
  return Response.json({ ventureId, bigIdea: idea })
}

export async function PATCH(request: Request): Promise<Response> {
  const ventureId = await getVentureId()
  let body: Partial<BrandBigIdea>
  try { body = await request.json() as Partial<BrandBigIdea> }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const current = await getBigIdea(ventureId) ?? {
    brandNameMeaning: '', idealPerson: '', idealPersonTraits: '',
    gatheringActivity: '', missionBeyondProduct: '', platformFocus: 'instagram' as const,
  }

  const merged: BrandBigIdea = { ...current, ...body }
  await saveBigIdea(ventureId, merged)
  return Response.json({ ventureId, bigIdea: merged })
}

// POST /api/big-idea — generate AI-drafted answers from existing venture profile
export async function POST(request: Request): Promise<Response> {
  const ventureId = await getVentureId()

  let body: { action?: string } = {}
  try { body = await request.json() as typeof body } catch { /* ok */ }

  if (body.action !== 'generate') {
    return Response.json({ error: 'Unknown action. Use { action: "generate" }' }, { status: 400 })
  }

  // Pull venture profile to seed the AI draft
  const { data: v } = await supabase
    .from('ventures')
    .select('name, description, tagline, brand_type')
    .eq('id', ventureId)
    .single()

  const prompt = `You are a brand strategist. Answer in valid JSON only.

Venture profile:
- Name: ${v?.name ?? 'Unknown'}
- Description: ${v?.description ?? '(none)'}
- Tagline: ${v?.tagline ?? '(none)'}
- Type: ${v?.brand_type ?? '(none)'}

Draft short 1-sentence answers to these 5 Big Idea questions. Be specific but brief.

Return ONLY valid JSON, no other text:
{"brandNameMeaning":"...","idealPerson":"...","idealPersonTraits":"trait1, trait2, trait3, trait4","gatheringActivity":"...","missionBeyondProduct":"..."}`

  try {
    const raw = await callFast({ messages: [{ role: 'user', content: prompt }], maxTokens: 1200 })
    let draft: BrandBigIdea | null = null

    // Attempt 1: direct JSON parse
    try { draft = JSON.parse(raw.trim()) as BrandBigIdea } catch { /* fall through */ }

    // Attempt 2: extract from markdown code fence
    if (!draft) {
      const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeMatch) {
        try { draft = JSON.parse(codeMatch[1].trim()) as BrandBigIdea } catch { /* fall through */ }
      }
    }

    // Attempt 3: find JSON object in free text
    if (!draft) {
      const objMatch = raw.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/)
      if (objMatch) {
        try { draft = JSON.parse(objMatch[0]) as BrandBigIdea } catch { /* fall through */ }
      }
    }

    if (!draft) {
      return Response.json({
        error: 'AI returned invalid JSON',
        snippet: raw.slice(0, 200),
      }, { status: 502 })
    }

    return Response.json({ ventureId, draft })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
