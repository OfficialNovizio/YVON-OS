// Narrative Arc Planner — 4-week connected content sequences
// POST: generates a 4-week narrative arc plan

import { cookies } from 'next/headers'
import { callSynthesis } from '@/lib/ai-client'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request): Promise<Response> {
  let body: { theme?: string; goal?: string; platform?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const prompt = `You are a narrative arc planner. Create a 4-week connected content sequence for a brand.

Theme: ${body.theme ?? 'Brand Authority'}
Goal: ${body.goal ?? 'Build audience engagement and authority'}
Platform: ${body.platform ?? 'All platforms'}

Each week builds on the last. Week 1 introduces, Week 2 deepens, Week 3 converts, Week 4 compounds.

Return ONLY valid JSON:
{
  "title": "name of this narrative arc",
  "theme": "central theme",
  "weeks": [
    {
      "week": 1,
      "theme": "what this week focuses on",
      "posts": [
        {"title": "...", "hook": "...", "platform": "...", "format": "...", "day": "Monday"}
      ],
      "goal": "what to achieve this week"
    }
  ]
}`

  try {
    const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 4000 })
    const arc = JSON.parse(raw) as Record<string, unknown>

    await supabase.from('narrative_arcs').insert({
      venture_id: ventureId,
      title: (arc.title as string) ?? 'Untitled Arc',
      theme: (arc.theme as string) ?? '',
      week_count: 4,
      arc_plan: arc,
      start_date: new Date().toISOString().split('T')[0],
      status: 'planned',
    })

    return Response.json({ arc })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

// GET /api/narrative-arc — list active arcs
export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const { data } = await supabase
    .from('narrative_arcs')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(10)

  return Response.json({ arcs: data ?? [] })
}
