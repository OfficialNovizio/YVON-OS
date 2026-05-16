// Content Series — CRUD for the content_series table

import 'server-only'
import { supabase } from '@/lib/supabase'
import type { ContentSeries } from '@/lib/types'

function rowToSeries(row: Record<string, unknown>): ContentSeries {
  return {
    id:          row.id          as string,
    ventureId:   row.venture_id  as string,
    name:        row.name        as string,
    description: row.description as string,
    format:      row.format      as ContentSeries['format'],
    frequency:   row.frequency   as ContentSeries['frequency'],
    platform:    row.platform    as string,
    fanGoal:     (row.fan_goal   as ContentSeries['fanGoal']) ?? 'advocate',
    active:      row.active      as boolean,
    sortOrder:   row.sort_order  as number,
    createdAt:   row.created_at  as string,
    updatedAt:   row.updated_at  as string,
  }
}

export async function getContentSeries(ventureId: string): Promise<ContentSeries[]> {
  const { data } = await supabase
    .from('content_series')
    .select('*')
    .eq('venture_id', ventureId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return (data ?? []).map(r => rowToSeries(r as Record<string, unknown>))
}

export async function createContentSeries(
  ventureId: string,
  payload: Omit<ContentSeries, 'id' | 'ventureId' | 'createdAt' | 'updatedAt'>
): Promise<ContentSeries> {
  const { data, error } = await supabase
    .from('content_series')
    .insert({
      venture_id:  ventureId,
      name:        payload.name,
      description: payload.description,
      format:      payload.format,
      frequency:   payload.frequency,
      platform:    payload.platform,
      fan_goal:    payload.fanGoal ?? 'advocate',
      active:      payload.active,
      sort_order:  payload.sortOrder,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToSeries(data as Record<string, unknown>)
}

export async function updateContentSeries(
  id: string,
  ventureId: string,
  payload: Partial<Omit<ContentSeries, 'id' | 'ventureId' | 'createdAt' | 'updatedAt'>>
): Promise<ContentSeries> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (payload.name        !== undefined) update.name        = payload.name
  if (payload.description !== undefined) update.description = payload.description
  if (payload.format      !== undefined) update.format      = payload.format
  if (payload.frequency   !== undefined) update.frequency   = payload.frequency
  if (payload.platform    !== undefined) update.platform    = payload.platform
  if (payload.fanGoal     !== undefined) update.fan_goal    = payload.fanGoal
  if (payload.active      !== undefined) update.active      = payload.active
  if (payload.sortOrder   !== undefined) update.sort_order  = payload.sortOrder

  const { data, error } = await supabase
    .from('content_series')
    .update(update)
    .eq('id', id)
    .eq('venture_id', ventureId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rowToSeries(data as Record<string, unknown>)
}

export async function deleteContentSeries(id: string, ventureId: string): Promise<void> {
  await supabase
    .from('content_series')
    .delete()
    .eq('id', id)
    .eq('venture_id', ventureId)
}

// Seed the 3 default series for a new venture
export async function seedDefaultSeries(ventureId: string): Promise<void> {
  const existing = await getContentSeries(ventureId)
  if (existing.length > 0) return

  const defaults = [
    { name: 'Founder Vlog',       description: 'Behind the scenes of running the brand — packing orders, checking samples, shoot prep. 1-2× per week.', format: 'reel' as const, frequency: 'weekly' as const,   platform: 'instagram', fanGoal: 'faithful'  as const, active: true, sortOrder: 0 },
    { name: 'Customer Spotlight', description: 'Repost a customer wearing the product + a mini-interview caption about their life as it relates to the brand message. 1× per week.', format: 'reel' as const, frequency: 'weekly' as const,   platform: 'instagram', fanGoal: 'advocate'  as const, active: true, sortOrder: 1 },
    { name: 'Community Event',    description: 'Turn the brand lifestyle into a literal event — coffee club, training session, creative gathering. Film it.', format: 'reel' as const, frequency: 'monthly' as const, platform: 'instagram', fanGoal: 'nurtured'  as const, active: true, sortOrder: 2 },
  ]

  await Promise.all(defaults.map(d => createContentSeries(ventureId, d)))
}
