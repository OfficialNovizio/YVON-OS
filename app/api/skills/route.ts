import { searchSkills, trackSkillUsage } from '@/lib/db'
import type { AgentId } from '@/lib/types'

// GET /api/skills?keywords=framing,system1&agent=daniel-kahneman&limit=5&tier=1
// tier=1 → metadata only (name, description, tags)
// tier=2 → full content (default)

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)

  const rawKeywords = searchParams.get('keywords') ?? ''
  const keywords    = rawKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
  const agentId     = searchParams.get('agent') as AgentId | null
  const limit       = Math.min(parseInt(searchParams.get('limit') ?? '5'), 20)
  const tier        = searchParams.get('tier') === '1' ? 1 : 2

  if (keywords.length === 0) {
    return Response.json({ error: 'keywords param required' }, { status: 400 })
  }

  try {
    const skills = await searchSkills(keywords, agentId ?? undefined, limit)

    // Track usage for Tier 1+2 requests (fire-and-forget)
    for (const skill of skills) {
      if (skill.name) {
        trackSkillUsage(skill.name).catch(() => { /* non-fatal */ })
      }
    }

    // Tier 1: strip content, return metadata only
    if (tier === 1) {
      const metadata = skills.map(s => ({
        name:            s.name,
        description:     s.description,
        triggerKeywords: s.triggerKeywords,
        variant:         s.variant,
      }))
      return Response.json(metadata)
    }

    return Response.json(skills)
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
