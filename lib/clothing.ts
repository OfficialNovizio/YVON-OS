import 'server-only'
import { supabase } from '@/lib/supabase'
import type { ClothingItem } from '@/lib/types'

const NOVIZIO_DEFAULTS: Omit<ClothingItem, 'id' | 'ventureId' | 'createdAt'>[] = [
  { name: 'Structured Merino Crewneck', category: 'top',       color: 'Ivory / Slate',     description: 'Clean-lined merino knit, slightly oversized with dropped shoulder.',    season: 'all',    active: true, sortOrder: 0 },
  { name: 'Relaxed Oxford Button-Down', category: 'top',       color: 'White / Blue',      description: 'Premium cotton oxford, untucked or half-tucked styling.',              season: 'all',    active: true, sortOrder: 1 },
  { name: 'Ribbed Fitted Longsleeve',   category: 'top',       color: 'Black / Ecru',      description: 'Second-skin rib knit base layer, pairs with outerwear.',              season: 'all',    active: true, sortOrder: 2 },
  { name: 'Wide-Leg Tailored Trousers', category: 'bottom',    color: 'Charcoal / Camel',  description: 'High-rise wide-leg cut, clean break at ankle, lined.',                season: 'all',    active: true, sortOrder: 3 },
  { name: 'Straight-Leg Carpenter',     category: 'bottom',    color: 'Raw Indigo',        description: 'Raw denim carpenter with tonal stitching, relaxed seat and thigh.',   season: 'all',    active: true, sortOrder: 4 },
  { name: 'Pleated Chino',              category: 'bottom',    color: 'Sand / Olive',      description: 'Double-pleated chino with a tapered ankle, Italian fabric.',          season: 'spring', active: true, sortOrder: 5 },
  { name: 'Oversized Wool Overcoat',    category: 'outerwear', color: 'Camel / Charcoal',  description: 'Single-breasted, boxy silhouette, 100% wool, satin-lined.',           season: 'fall',   active: true, sortOrder: 6 },
  { name: 'Leather Bomber',             category: 'outerwear', color: 'Black / Cognac',    description: 'Smooth lamb leather bomber with knit ribbing at cuffs and hem.',      season: 'all',    active: true, sortOrder: 7 },
  { name: 'Technical Hooded Jacket',    category: 'outerwear', color: 'Slate / Forest',    description: 'Minimalist nylon shell, hidden seams, dual zip pockets.',             season: 'all',    active: true, sortOrder: 8 },
  { name: 'Low Leather Derby',          category: 'footwear',  color: 'Black / White',     description: 'Clean toe cap derby in full-grain leather, minimal branding.',        season: 'all',    active: true, sortOrder: 9 },
  { name: 'Canvas Low-Top',             category: 'footwear',  color: 'Ecru / Black',      description: 'Vulcanized canvas sneaker with tonal sole.',                          season: 'all',    active: true, sortOrder: 10 },
  { name: 'Minimal Leather Belt',       category: 'accessory', color: 'Black / Tan',       description: 'Single-stitch belt, brass pin buckle, Italian full-grain.',           season: 'all',    active: true, sortOrder: 11 },
  { name: 'Signet Ring',                category: 'accessory', color: 'Gold / Silver',     description: 'Brushed metal signet, oval face, unisex sizing.',                     season: 'all',    active: true, sortOrder: 12 },
]

async function seedDefaults(ventureId: string): Promise<void> {
  const rows = NOVIZIO_DEFAULTS.map((item, i) => ({
    venture_id:  ventureId,
    name:        item.name,
    category:    item.category,
    color:       item.color,
    description: item.description,
    season:      item.season,
    active:      item.active,
    sort_order:  i,
  }))
  await supabase.from('clothing_items').insert(rows)
}

function rowToItem(row: Record<string, unknown>): ClothingItem {
  return {
    id:          row.id          as string,
    ventureId:   row.venture_id  as string,
    name:        row.name        as string,
    category:    row.category    as ClothingItem['category'],
    color:       row.color       as string,
    description: row.description as string,
    season:      row.season      as string,
    active:      row.active      as boolean,
    sortOrder:   row.sort_order  as number,
    createdAt:   row.created_at  as string,
  }
}

export async function getClothingItems(ventureId: string): Promise<ClothingItem[]> {
  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('active', true)
    .order('sort_order')

  // Table does not exist yet — migration 021 needs to be run
  if (error) {
    console.error('[clothing] getClothingItems error:', error.message)
    return []
  }

  if (!data || data.length === 0) {
    await seedDefaults(ventureId)
    const { data: seeded } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('active', true)
      .order('sort_order')
    return (seeded ?? []).map(r => rowToItem(r as Record<string, unknown>))
  }

  return data.map(r => rowToItem(r as Record<string, unknown>))
}

export async function createClothingItem(
  ventureId: string,
  item: Omit<ClothingItem, 'id' | 'ventureId' | 'createdAt'>,
): Promise<ClothingItem> {
  const { data, error } = await supabase
    .from('clothing_items')
    .insert({
      venture_id:  ventureId,
      name:        item.name,
      category:    item.category,
      color:       item.color,
      description: item.description,
      season:      item.season ?? 'all',
      active:      item.active ?? true,
      sort_order:  item.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Insert failed')
  return rowToItem(data as Record<string, unknown>)
}

export async function updateClothingItem(
  id: string,
  patch: Partial<Omit<ClothingItem, 'id' | 'ventureId' | 'createdAt'>>,
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.name        !== undefined) update.name        = patch.name
  if (patch.category    !== undefined) update.category    = patch.category
  if (patch.color       !== undefined) update.color       = patch.color
  if (patch.description !== undefined) update.description = patch.description
  if (patch.season      !== undefined) update.season      = patch.season
  if (patch.active      !== undefined) update.active      = patch.active
  if (patch.sortOrder   !== undefined) update.sort_order  = patch.sortOrder
  update.updated_at = new Date().toISOString()
  await supabase.from('clothing_items').update(update).eq('id', id)
}
