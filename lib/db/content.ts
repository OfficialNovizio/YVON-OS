import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  ContentSuggestion,
  ContentType,
  ContentCalendarEntry,
  CalendarStatus,
  Brief,
} from '@/lib/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapCalendarRow(r: Record<string, unknown>): ContentCalendarEntry {
  return {
    id: r.id as string,
    ventureId: r.venture_id as string,
    planDate: r.plan_date as string,
    contentType: r.content_type as ContentCalendarEntry['contentType'],
    platform: r.platform as ContentCalendarEntry['platform'],
    headline: (r.headline as string | null) ?? undefined,
    brief: (r.brief as string | null) ?? undefined,
    status: r.status as CalendarStatus,
    assetUrl: (r.asset_url as string | null) ?? undefined,
    postUrl: (r.post_url as string | null) ?? undefined,
    verifiedAt: (r.verified_at as string | null) ?? undefined,
    originalId: (r.original_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }
}

// ─── Content Calendar ─────────────────────────────────────────────────────────

export async function getContentCalendar(
  ventureId: string,
  month: string  // 'YYYY-MM'
): Promise<ContentCalendarEntry[]> {
  const startDate = `${month}-01`
  const year = parseInt(month.split('-')[0])
  const mon = parseInt(month.split('-')[1])
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  const { data } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .order('plan_date', { ascending: true })

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    planDate: r.plan_date,
    contentType: r.content_type as ContentCalendarEntry['contentType'],
    platform: r.platform as ContentCalendarEntry['platform'],
    headline: r.headline ?? undefined,
    brief: r.brief ?? undefined,
    status: r.status as CalendarStatus,
    assetUrl: r.asset_url ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function createContentCalendarEntry(
  data: Omit<ContentCalendarEntry, 'id' | 'createdAt'>
): Promise<ContentCalendarEntry> {
  const { data: row, error } = await supabase
    .from('content_calendar')
    .insert({
      venture_id: data.ventureId,
      plan_date: data.planDate,
      content_type: data.contentType,
      platform: data.platform,
      headline: data.headline ?? null,
      brief: data.brief ?? null,
      status: data.status,
      asset_url: data.assetUrl ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    planDate: row.plan_date,
    contentType: row.content_type as ContentCalendarEntry['contentType'],
    platform: row.platform as ContentCalendarEntry['platform'],
    headline: row.headline ?? undefined,
    brief: row.brief ?? undefined,
    status: row.status as CalendarStatus,
    assetUrl: row.asset_url ?? undefined,
    createdAt: row.created_at,
  }
}

export async function deleteContentCalendarEntry(id: string): Promise<void> {
  await supabase.from('content_calendar').delete().eq('id', id)
}

export async function getPastDuePlanned(ventureId: string): Promise<ContentCalendarEntry[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('venture_id', ventureId)
    .lt('plan_date', today)
    .in('status', ['planned', 'in-production'])
    .order('plan_date', { ascending: true })

  return (data ?? []).map(mapCalendarRow)
}

export async function markAsPosted(id: string, postUrl: string): Promise<void> {
  await supabase
    .from('content_calendar')
    .update({ status: 'posted', post_url: postUrl, verified_at: new Date().toISOString() })
    .eq('id', id)
}

export async function markAsMissed(id: string): Promise<void> {
  await supabase
    .from('content_calendar')
    .update({ status: 'missed' })
    .eq('id', id)
}

export async function replanEntry(
  missedId: string,
  newDate: string,
  ventureId: string,
  contentType: string,
  platform: string,
  headline?: string,
  brief?: string
): Promise<ContentCalendarEntry> {
  await supabase
    .from('content_calendar')
    .update({ status: 'replanned' })
    .eq('id', missedId)

  return createContentCalendarEntry({
    ventureId,
    planDate: newDate,
    contentType: contentType as ContentCalendarEntry['contentType'],
    platform: platform as ContentCalendarEntry['platform'],
    headline,
    brief,
    status: 'planned',
  })
}

export async function skipEntry(id: string): Promise<void> {
  await supabase
    .from('content_calendar')
    .update({ status: 'skipped' })
    .eq('id', id)
}

export async function getPostedEntries(ventureId: string, month: string): Promise<ContentCalendarEntry[]> {
  const startDate = `${month}-01`
  const year = parseInt(month.split('-')[0])
  const mon = parseInt(month.split('-')[1])
  const lastDay = new Date(year, mon, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  const { data } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .eq('status', 'posted')
    .order('plan_date', { ascending: false })

  return (data ?? []).map(mapCalendarRow)
}

export async function getMissedEntries(ventureId: string): Promise<ContentCalendarEntry[]> {
  const { data } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('status', 'missed')
    .order('plan_date', { ascending: true })

  return (data ?? []).map(mapCalendarRow)
}

// ─── Content Suggestions ──────────────────────────────────────────────────────

export async function getContentSuggestions(
  ventureId: string,
  platform?: string
): Promise<ContentSuggestion[]> {
  let q = supabase.from('content_suggestions').select('*').eq('venture_id', ventureId)
  if (platform) q = q.eq('platform', platform)
  const { data } = await q.order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    platform: r.platform,
    contentType: r.content_type as ContentType,
    topic: r.topic ?? undefined,
    caption: r.caption ?? undefined,
    hashtags: r.hashtags ?? undefined,
    audioSuggestion: r.audio_suggestion ?? undefined,
    hook: r.hook ?? undefined,
    hookVariants: r.hook_variants ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function createContentSuggestion(
  data: Omit<ContentSuggestion, 'id' | 'createdAt'>
): Promise<ContentSuggestion> {
  const { data: row, error } = await supabase
    .from('content_suggestions')
    .insert({
      venture_id: data.ventureId,
      platform: data.platform,
      content_type: data.contentType,
      topic: data.topic ?? null,
      caption: data.caption ?? null,
      hashtags: data.hashtags ?? null,
      audio_suggestion: data.audioSuggestion ?? null,
      hook: data.hook ?? null,
      hook_variants: data.hookVariants ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    platform: row.platform,
    contentType: row.content_type as ContentType,
    topic: row.topic ?? undefined,
    caption: row.caption ?? undefined,
    hashtags: row.hashtags ?? undefined,
    audioSuggestion: row.audio_suggestion ?? undefined,
    hook: row.hook ?? undefined,
    hookVariants: row.hook_variants ?? undefined,
    createdAt: row.created_at,
  }
}

// ─── Briefs ───────────────────────────────────────────────────────────────────

export async function getBriefs(ventureId: string): Promise<Brief[]> {
  const { data } = await supabase
    .from('briefs')
    .select('*')
    .eq('venture_id', ventureId)
    .order('date', { ascending: false })
    .limit(30)

  return (data ?? []).map((row) => ({
    id: row.id,
    ventureId: row.venture_id,
    content: row.content,
    date: row.date,
    readAt: row.read_at ?? null,
    emailSent: row.email_sent ?? false,
  }))
}

export async function createBrief(ventureId: string, content: string): Promise<string> {
  const { data, error } = await supabase
    .from('briefs')
    .insert({ venture_id: ventureId, content, date: new Date().toISOString() })
    .select('id')
    .single()
  if (error || !data) throw new Error('Failed to create brief')
  return data.id as string
}

export async function markBriefRead(briefId: string): Promise<void> {
  await supabase
    .from('briefs')
    .update({ read_at: new Date().toISOString() })
    .eq('id', briefId)
}
