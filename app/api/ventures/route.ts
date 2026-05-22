import { getAllVentures, createVenture } from '@/lib/db'
import { VENTURES } from '@/lib/venture-context'
import type { VentureConfig } from '@/lib/types'

export async function GET(): Promise<Response> {
  try {
    let ventures = await getAllVentures()

    // Seed default ventures on first access when DB table is empty
    if (ventures.length === 0) {
      const seeded: VentureConfig[] = []
      for (const v of VENTURES) {
        try {
          const created = await createVenture({
            name:          v.name,
            slug:          v.slug,
            color:         v.color,
            igHandle:      '',
            ytChannelId:   '',
            liProfileUrl:  '',
            ga4PropertyId: '',
            // Omit migration-014 fields — they default to NULL if columns don't exist yet
          })
          seeded.push(created)
        } catch {
          // Row already exists or migration not run — fall through
        }
      }
      const afterSeed = seeded.length > 0 ? seeded : await getAllVentures()
      ventures = afterSeed
    }

    return Response.json(ventures)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: Partial<Omit<VentureConfig, 'id'>>
  try {
    body = await request.json() as Partial<Omit<VentureConfig, 'id'>>
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, slug } = body
  if (!name || !slug) {
    return Response.json({ error: 'name and slug are required' }, { status: 400 })
  }

  try {
    const venture = await createVenture({
      name,
      slug,
      color:         body.color         ?? '#E94560',
      igHandle:      body.igHandle      ?? '',
      ytChannelId:   body.ytChannelId   ?? '',
      liProfileUrl:  body.liProfileUrl  ?? '',
      ga4PropertyId: body.ga4PropertyId ?? '',
      description:   body.description,
      tagline:       body.tagline,
      brandType:     body.brandType,
      status:        body.status        ?? 'active',
      websiteUrl:    body.websiteUrl,
      logoUrl:       body.logoUrl,
      foundedYear:   body.foundedYear,
      repoUrl:       body.repoUrl,
      notionUrl:     body.notionUrl,
    })
    return Response.json(venture, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
