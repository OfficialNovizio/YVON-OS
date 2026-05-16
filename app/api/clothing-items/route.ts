import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { getClothingItems, createClothingItem, updateClothingItem } from '@/lib/clothing'

interface ClothingBody {
  name:        string
  category:    'top' | 'bottom' | 'outerwear' | 'footwear' | 'accessory'
  color:       string
  description: string
  season?:     string
  active?:     boolean
  sortOrder?:  number
}

async function resolveVentureId(slug: string): Promise<string> {
  const { data } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  return (data?.id as string | undefined) ?? slug
}

export async function GET(): Promise<Response> {
  try {
    const cookieStore = await cookies()
    const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
    const ventureId = await resolveVentureId(slug)
    const items = await getClothingItems(ventureId)
    return Response.json({ ventureId, items })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg, items: [] }, { status: 502 })
  }
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const slug = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'
  const ventureId = await resolveVentureId(slug)

  let body: ClothingBody
  try { body = await request.json() as ClothingBody }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.name?.trim())     return Response.json({ error: 'name required' }, { status: 400 })
  if (!body.category?.trim()) return Response.json({ error: 'category required' }, { status: 400 })

  const item = await createClothingItem(ventureId, {
    name:        body.name.trim(),
    category:    body.category,
    color:       body.color?.trim() ?? '',
    description: body.description?.trim() ?? '',
    season:      body.season ?? 'all',
    active:      body.active ?? true,
    sortOrder:   body.sortOrder ?? 0,
  })

  return Response.json({ item }, { status: 201 })
}

export async function PATCH(request: Request): Promise<Response> {
  let body: { id: string } & Partial<ClothingBody>
  try { body = await request.json() as { id: string } & Partial<ClothingBody> }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })

  await updateClothingItem(body.id, {
    name:        body.name,
    category:    body.category,
    color:       body.color,
    description: body.description,
    season:      body.season,
    active:      body.active,
    sortOrder:   body.sortOrder,
  })

  return Response.json({ ok: true })
}
