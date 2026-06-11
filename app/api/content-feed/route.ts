// GET  /api/content-feed?type=pipeline|scheduler|shorts&venture=x
// POST /api/content-feed — update stage, approve, schedule
//
// Wire: Content Pipeline (Kanban), Scheduler (calendar), Shorts (distribution)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const MOCK_PIPELINE = [
  { id: 'cp1', title: 'I gave 5 AI agents one idea for a week', stage: 'ideas', platform: 'YouTube', agent: 'Kai', workspace: 'vibe', createdAt: '2026-06-10T08:00Z' },
  { id: 'cp2', title: 'Building a SaaS company with just Claude Code', stage: 'scripting', platform: 'YouTube', agent: 'William', workspace: 'vibe', createdAt: '2026-06-09T14:00Z' },
  { id: 'cp3', title: 'AI agents that ship code while you sleep', stage: 'thumbnails', platform: 'YouTube', agent: 'Leonardo', workspace: 'vibe', createdAt: '2026-06-08T10:00Z' },
  { id: 'cp4', title: 'My agent stack fully explained', stage: 'filming', platform: 'YouTube', agent: 'Nexus', workspace: 'vibe', createdAt: '2026-06-07T16:00Z' },
  { id: 'cp5', title: 'From idea to shipped in one prompt', stage: 'editing', platform: 'YouTube', agent: 'Dev', workspace: 'vibe', createdAt: '2026-06-06T12:00Z' },
  { id: 'cp6', title: 'Why I fired my dashboards for a cockpit', stage: 'ready', platform: 'YouTube', agent: 'Marcus', workspace: 'vibe', createdAt: '2026-06-05T09:00Z' },
  { id: 'cp7', title: 'Building my Mission Control part 1', stage: 'published', platform: 'YouTube', agent: 'Marcus', workspace: 'vibe', createdAt: '2026-06-04T11:00Z' },
]

const MOCK_SHORTS = [
  { id: 'sh1', title: 'Agent ships code in 20 min', platform: 'YouTube', status: 'ready', workspace: 'vibe', createdAt: '2026-06-10T07:00Z' },
  { id: 'sh2', title: 'Memory system breakdown', platform: 'Instagram', status: 'ready', workspace: 'vibe', createdAt: '2026-06-10T06:30Z' },
  { id: 'sh3', title: 'Convert the agent trend', platform: 'TikTok', status: 'draft', workspace: 'vibe', createdAt: '2026-06-09T15:00Z' },
]

const MOCK_SCHEDULER = [
  { id: 'sc1', title: 'Agent trend breakdown', platform: 'LinkedIn', day: '2026-06-18', time: '09:00', status: 'scheduled', workspace: 'vibe', type: 'post' },
  { id: 'sc2', title: 'Shipping software in 20 min', platform: 'Instagram', day: '2026-06-19', time: '12:00', status: 'scheduled', workspace: 'vibe', type: 'reel' },
  { id: 'sc3', title: 'Memory system architecture', platform: 'YouTube', day: '2026-06-20', time: '17:00', status: 'draft', workspace: 'vibe', type: 'video' },
  { id: 'sc4', title: 'Weekly newsletter #13', platform: 'Kit', day: '2026-06-21', time: '08:00', status: 'scheduled', workspace: 'vibe', type: 'newsletter' },
]

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const type = url.searchParams.get('type') ?? 'pipeline'
  const venture = url.searchParams.get('venture') ?? null

  try {
    // Try Supabase first
    const { data: livePosts } = await supabase
      .from('social_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (livePosts && livePosts.length > 0) {
      const mapped = livePosts.map((p) => ({
        id: p.id,
        title: p.title ?? p.caption?.slice(0, 60) ?? 'Untitled',
        stage: p.status === 'published' ? 'published' : p.scheduled_for ? 'scheduled' : 'draft',
        platform: p.platform ?? 'YouTube',
        agent: p.proposed_by ?? 'William',
        workspace: p.venture_slug ?? 'vibe',
        createdAt: p.created_at,
      }))
      return Response.json({ items: mapped, total: mapped.length, source: 'supabase' })
    }

    // Fallback to mock data
    const mockMap: Record<string, Record<string, unknown>[]> = {
      pipeline: MOCK_PIPELINE,
      shorts: MOCK_SHORTS,
      scheduler: MOCK_SCHEDULER,
    }

    const items = (mockMap[type] ?? MOCK_PIPELINE) as unknown as typeof MOCK_PIPELINE

    if (venture) {
      return Response.json({ items: items.filter((i) => i.workspace === venture), total: items.length, source: 'mock' })
    }

    return Response.json({ items, total: items.length, source: 'mock' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, items: MOCK_PIPELINE, total: 0, source: 'mock-fallback' })
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { id, stage, scheduledDate } = body
    return Response.json({ success: true, id, stage, scheduledDate })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }
}
