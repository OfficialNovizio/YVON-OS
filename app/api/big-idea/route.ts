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

  const prompt = `You are a brand strategist using the Community Content Strategy framework.

Venture profile:
- Name: ${v?.name ?? 'Unknown'}
- Description: ${v?.description ?? '(none)'}
- Tagline: ${v?.tagline ?? '(none)'}
- Type: ${v?.brand_type ?? '(none)'}

Based ONLY on the information above, draft short, thoughtful answers to these 5 Big Idea questions.
Be specific and grounded — do not invent facts. If you cannot confidently answer a question, write a useful placeholder the user can edit.

Return ONLY valid JSON — no markdown:
{
  "brandNameMeaning": "What does the brand name mean? (etymology, origin, metaphor)",
  "idealPerson": "Name ONE specific person (real or archetype) who best embodies this brand",
  "idealPersonTraits": "List 4-6 traits about that person aligned with the brand (comma-separated)",
  "gatheringActivity": "If that person and others like them gathered, what would they be doing?",
  "missionBeyondProduct": "What is the greater mission beyond selling the product?"
}`

  try {
    const raw = await callFast({ messages: [{ role: 'user', content: prompt }], maxTokens: 800 })
    const clean = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const draft = JSON.parse(clean) as BrandBigIdea
    return Response.json({ ventureId, draft })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
