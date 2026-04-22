import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  InstagramStats,
  YouTubeStats,
  LinkedInStats,
  AnalyticsReport,
  TrendItem,
  TrendStatus,
  Message,
  Brief,
  AgentSettingsSave,
  VentureConfig,
  Task,
  TaskStatus,
  TaskPriority,
  AgentId,
  Deliverable,
  DeliverableType,
  SopDoc,
  SopCategory,
  ContentSuggestion,
  ContentType,
  CompetitorContent,
  ActivityEvent,
  ActivityEventType,
  Decision,
  DecisionAction,
  DailyLog,
  ContentCalendarEntry,
  CalendarStatus,
  CalendarPlatform,
  SocialPostCache,
  ContentScoreCard,
  AnomalyAlert,
  AudienceMomentumEntry,
  AttributionPath,
} from '@/lib/types'

// ─── Social Stats ─────────────────────────────────────────────────────────────

export async function getSocialStats(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin'
): Promise<InstagramStats | YouTubeStats | LinkedInStats | null> {
  const { data } = await supabase
    .from('social_stats')
    .select('data')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .single()
  return data?.data ?? null
}

export async function setSocialStats(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  stats: InstagramStats | YouTubeStats | LinkedInStats
): Promise<void> {
  await supabase.from('social_stats').upsert(
    { venture_id: ventureId, platform, data: stats, fetched_at: new Date().toISOString() },
    { onConflict: 'venture_id,platform' }
  )
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsReport(ventureId: string): Promise<AnalyticsReport | null> {
  const { data } = await supabase
    .from('analytics_reports')
    .select('data')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data?.data ?? null
}

export async function setAnalyticsReport(
  ventureId: string,
  report: AnalyticsReport
): Promise<void> {
  await supabase.from('analytics_reports').insert({
    venture_id: ventureId,
    data: report,
    period: report.period,
  })
}

// ─── Trending ─────────────────────────────────────────────────────────────────

export async function getTrendingItems(
  ventureId: string,
  status?: TrendStatus
): Promise<TrendItem[]> {
  let query = supabase
    .from('trending_items')
    .select('*')
    .eq('venture_id', ventureId)
    .order('generated_at', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)

  const { data } = await query
  return (data ?? []).map((row) => ({
    id: row.id,
    keyword: row.keyword,
    angle: row.angle,
    platform: row.platform,
    status: row.status,
    generatedAt: row.generated_at,
  }))
}

export async function upsertTrendingItem(
  ventureId: string,
  item: Omit<TrendItem, 'id'> & { id?: string }
): Promise<void> {
  await supabase.from('trending_items').upsert({
    id: item.id ?? crypto.randomUUID(),
    venture_id: ventureId,
    keyword: item.keyword,
    angle: item.angle,
    platform: item.platform,
    status: item.status,
    generated_at: item.generatedAt,
  })
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversation(
  agentId: string,
  ventureId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('agent_id', agentId)
    .eq('venture_id', ventureId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

export async function createConversation(
  agentId: string,
  ventureId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ agent_id: agentId, venture_id: ventureId })
    .select('id')
    .single()
  if (error || !data) throw new Error('Failed to create conversation')
  return data.id as string
}

export async function appendMessage(
  conversationId: string,
  message: Message
): Promise<void> {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: message.role,
    content: message.content,
    sent_at: message.timestamp,
  })
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

// ─── Agent Memory ─────────────────────────────────────────────────────────────

export async function getAgentMemory(
  agentId: string,
  ventureId: string
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('agent_memory')
    .select('key, value')
    .eq('agent_id', agentId)
    .eq('venture_id', ventureId)

  const result: Record<string, unknown> = {}
  for (const row of data ?? []) {
    result[row.key] = row.value
  }
  return result
}

export async function setAgentMemory(
  agentId: string,
  ventureId: string,
  key: string,
  value: unknown
): Promise<void> {
  await supabase.from('agent_memory').upsert(
    {
      agent_id: agentId,
      venture_id: ventureId,
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agent_id,venture_id,key' }
  )
}

export async function deleteAgentMemory(
  agentId: string,
  ventureId: string,
  key: string
): Promise<void> {
  await supabase
    .from('agent_memory')
    .delete()
    .eq('agent_id', agentId)
    .eq('venture_id', ventureId)
    .eq('key', key)
}

// ─── Agent Settings ───────────────────────────────────────────────────────────

export async function getAllAgentSettings(
  ventureId: string
): Promise<AgentSettingsSave[]> {
  const { data } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('venture_id', ventureId)

  return (data ?? []).map((row) => ({
    agentId: row.agent_id,
    model: row.model,
    systemPromptExtension: row.system_prompt_extension ?? '',
  }))
}

export async function saveAgentSettings(
  ventureId: string,
  settings: AgentSettingsSave
): Promise<void> {
  await supabase.from('agent_settings').upsert(
    {
      agent_id: settings.agentId,
      venture_id: ventureId,
      model: settings.model,
      system_prompt_extension: settings.systemPromptExtension,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agent_id,venture_id' }
  )
}

// ─── Ventures ─────────────────────────────────────────────────────────────────

export async function getAllVentures(): Promise<VentureConfig[]> {
  const { data } = await supabase.from('ventures').select('*').order('name')
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    color: r.color ?? '#E94560',
    igHandle: r.ig_handle ?? '',
    ytChannelId: r.yt_channel_id ?? '',
    liProfileUrl: r.li_profile_url ?? '',
    ga4PropertyId: r.ga4_property_id ?? '',
  }))
}

export async function createVenture(data: Omit<VentureConfig, 'id'>): Promise<VentureConfig> {
  const { data: row, error } = await supabase
    .from('ventures')
    .insert({
      name: data.name,
      slug: data.slug,
      color: data.color,
      ig_handle: data.igHandle,
      yt_channel_id: data.ytChannelId,
      li_profile_url: data.liProfileUrl,
      ga4_property_id: data.ga4PropertyId,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color ?? '#E94560',
    igHandle: row.ig_handle ?? '',
    ytChannelId: row.yt_channel_id ?? '',
    liProfileUrl: row.li_profile_url ?? '',
    ga4PropertyId: row.ga4_property_id ?? '',
  }
}

export async function updateVenture(
  id: string,
  data: Partial<Omit<VentureConfig, 'id'>>
): Promise<void> {
  const update: Record<string, string> = {}
  if (data.name)         update.name = data.name
  if (data.slug)         update.slug = data.slug
  if (data.color)        update.color = data.color
  if (data.igHandle !== undefined)      update.ig_handle = data.igHandle
  if (data.ytChannelId !== undefined)   update.yt_channel_id = data.ytChannelId
  if (data.liProfileUrl !== undefined)  update.li_profile_url = data.liProfileUrl
  if (data.ga4PropertyId !== undefined) update.ga4_property_id = data.ga4PropertyId
  await supabase.from('ventures').update(update).eq('id', id)
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasks(ventureId: string): Promise<Task[]> {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    title: r.title,
    description: r.description ?? undefined,
    status: r.status as TaskStatus,
    priority: r.priority as TaskPriority,
    dueDate: r.due_date ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function createTask(
  data: Omit<Task, 'id' | 'createdAt'>
): Promise<Task> {
  const { data: row, error } = await supabase
    .from('tasks')
    .insert({
      venture_id: data.ventureId,
      agent_id: data.agentId ?? null,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      due_date: data.dueDate ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id as AgentId | undefined,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
  }
}

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, 'status' | 'priority' | 'title' | 'description' | 'dueDate' | 'agentId'>>
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.status !== undefined)      update.status = data.status
  if (data.priority !== undefined)    update.priority = data.priority
  if (data.title !== undefined)       update.title = data.title
  if (data.description !== undefined) update.description = data.description
  if (data.dueDate !== undefined)     update.due_date = data.dueDate
  if (data.agentId !== undefined)     update.agent_id = data.agentId
  await supabase.from('tasks').update(update).eq('id', id)
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

export async function getDeliverables(ventureId: string): Promise<Deliverable[]> {
  const { data } = await supabase
    .from('deliverables')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    title: r.title,
    type: r.type as DeliverableType,
    content: r.content ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  }))
}

export async function createDeliverable(
  data: Omit<Deliverable, 'id' | 'createdAt'>
): Promise<Deliverable> {
  const { data: row, error } = await supabase
    .from('deliverables')
    .insert({
      venture_id: data.ventureId,
      agent_id: data.agentId ?? null,
      title: data.title,
      type: data.type,
      content: data.content ?? null,
      status: data.status,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    agentId: row.agent_id as AgentId | undefined,
    title: row.title,
    type: row.type as DeliverableType,
    content: row.content ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  }
}

// ─── SOPs ─────────────────────────────────────────────────────────────────────

export async function getSops(ventureId: string): Promise<SopDoc[]> {
  const { data } = await supabase
    .from('sops')
    .select('*')
    .eq('venture_id', ventureId)
    .order('updated_at', { ascending: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    title: r.title,
    content: r.content ?? undefined,
    category: r.category as SopCategory,
    agentId: r.agent_id as AgentId | undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function createSop(
  data: Omit<SopDoc, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SopDoc> {
  const now = new Date().toISOString()
  const { data: row, error } = await supabase
    .from('sops')
    .insert({
      venture_id: data.ventureId,
      title: data.title,
      content: data.content ?? null,
      category: data.category,
      agent_id: data.agentId ?? null,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id: row.id,
    ventureId: row.venture_id,
    title: row.title,
    content: row.content ?? undefined,
    category: row.category as SopCategory,
    agentId: row.agent_id as AgentId | undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateSop(
  id: string,
  data: Partial<Pick<SopDoc, 'title' | 'content' | 'category' | 'agentId'>>
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.title !== undefined)    update.title = data.title
  if (data.content !== undefined)  update.content = data.content
  if (data.category !== undefined) update.category = data.category
  if (data.agentId !== undefined)  update.agent_id = data.agentId
  await supabase.from('sops').update(update).eq('id', id)
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

// ─── Competitor Content ───────────────────────────────────────────────────────

export async function getCompetitorContent(
  ventureId: string,
  platform: string
): Promise<CompetitorContent[]> {
  const { data } = await supabase
    .from('competitor_content')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .order('fetched_at', { ascending: false })
    .limit(20)
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    platform: r.platform,
    title: r.title ?? undefined,
    description: r.description ?? undefined,
    engagementHint: r.engagement_hint ?? undefined,
    sourceUrl: r.source_url ?? undefined,
    fetchedAt: r.fetched_at,
  }))
}

export async function upsertCompetitorContent(
  items: Omit<CompetitorContent, 'id'>[]
): Promise<void> {
  if (items.length === 0) return
  await supabase.from('competitor_content').insert(
    items.map((item) => ({
      venture_id: item.ventureId,
      platform: item.platform,
      title: item.title ?? null,
      description: item.description ?? null,
      engagement_hint: item.engagementHint ?? null,
      source_url: item.sourceUrl ?? null,
      fetched_at: item.fetchedAt,
    }))
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function getActivityFeed(
  ventureId: string,
  limit = 50
): Promise<ActivityEvent[]> {
  const { data } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    agentId: r.agent_id as AgentId | undefined,
    type: r.type as ActivityEventType,
    message: r.message,
    metadata: r.metadata ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function logActivityEvent(
  event: Omit<ActivityEvent, 'id' | 'createdAt'>
): Promise<void> {
  await supabase.from('activity_feed').insert({
    venture_id: event.ventureId,
    agent_id: event.agentId ?? null,
    type: event.type,
    message: event.message,
    metadata: event.metadata ?? null,
  })
}

// ─── Decisions ────────────────────────────────────────────────────────────────

export async function getDecisions(
  ventureId: string,
  opts: { resolved?: boolean; limit?: number } = {}
): Promise<Decision[]> {
  let query = supabase
    .from('decisions')
    .select('*')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50)

  if (opts.resolved === false) {
    query = query.is('action_taken', null)
  } else if (opts.resolved === true) {
    query = query.not('action_taken', 'is', null)
  }

  const { data } = await query
  return (data ?? []).map(row => ({
    id: row.id as string,
    ventureId: row.venture_id as string,
    agentId: row.agent_id as string,
    decisionText: row.decision_text as string,
    question: (row.question as string | null) ?? undefined,
    actionTaken: (row.action_taken as DecisionAction | null) ?? undefined,
    urgency: row.urgency as Decision['urgency'],
    resolvedAt: (row.resolved_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
  }))
}

export async function createDecision(
  d: Omit<Decision, 'id' | 'createdAt' | 'resolvedAt' | 'actionTaken'>
): Promise<Decision> {
  const { data, error } = await supabase
    .from('decisions')
    .insert({
      venture_id: d.ventureId,
      agent_id: d.agentId,
      decision_text: d.decisionText,
      question: d.question ?? null,
      urgency: d.urgency,
    })
    .select('*')
    .single()
  if (error ?? !data) throw new Error('Failed to create decision')
  return {
    id: data.id as string,
    ventureId: data.venture_id as string,
    agentId: data.agent_id as string,
    decisionText: data.decision_text as string,
    question: (data.question as string | null) ?? undefined,
    urgency: data.urgency as Decision['urgency'],
    createdAt: data.created_at as string,
  }
}

export async function resolveDecision(id: string, action: DecisionAction): Promise<void> {
  await supabase
    .from('decisions')
    .update({ action_taken: action, resolved_at: new Date().toISOString() })
    .eq('id', id)
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export async function getDailyLogs(
  ventureId: string,
  opts: { days?: number } = {}
): Promise<DailyLog[]> {
  const since = new Date()
  since.setDate(since.getDate() - (opts.days ?? 7))

  const { data } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('log_date', since.toISOString().split('T')[0])
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []).map(row => ({
    id: row.id as string,
    ventureId: row.venture_id as string,
    agentId: row.agent_id as string,
    task: row.task as string,
    outcome: (row.outcome as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    logDate: row.log_date as string,
    createdAt: row.created_at as string,
  }))
}

export async function appendDailyLog(log: Omit<DailyLog, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('daily_logs').insert({
    venture_id: log.ventureId,
    agent_id: log.agentId,
    task: log.task,
    outcome: log.outcome ?? null,
    notes: log.notes ?? null,
    log_date: log.logDate,
  })
}

// ─── Content Calendar ───────────────────────────────────────────────────────

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
    createdAt: row.created_at,
  }
}

export async function deleteContentCalendarEntry(id: string): Promise<void> {
  await supabase.from('content_calendar').delete().eq('id', id)
}

// ─── Social Post Cache ──────────────────────────────────────────────────────

export async function getCachedPosts(
  ventureId: string,
  platform: string,
  startDate: string,
  endDate: string
): Promise<SocialPostCache[]> {
  const { data } = await supabase
    .from('social_posts_cache')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('post_date', startDate)
    .lte('post_date', endDate)
    .order('post_date', { ascending: false })

  return (data ?? []).map((r) => ({
    id: r.id,
    ventureId: r.venture_id,
    platform: r.platform as CalendarPlatform,
    postUrl: r.post_url ?? undefined,
    caption: r.caption ?? undefined,
    postDate: r.post_date,
    mediaType: r.media_type ?? undefined,
    scrapedAt: r.scraped_at,
  }))
}

export async function upsertCachedPosts(
  posts: Omit<SocialPostCache, 'id' | 'scrapedAt'>[]
): Promise<void> {
  if (posts.length === 0) return
  await supabase.from('social_posts_cache').upsert(
    posts.map((p) => ({
      venture_id: p.ventureId,
      platform: p.platform,
      post_url: p.postUrl ?? null,
      caption: p.caption ?? null,
      post_date: p.postDate,
      media_type: p.mediaType ?? null,
    })),
    { onConflict: 'venture_id,platform,post_url' }
  )
}

// ─── Verification Helpers ───────────────────────────────────────────────────

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
    postUrl: (r.post_url as string | null) ?? undefined,
    verifiedAt: (r.verified_at as string | null) ?? undefined,
    originalId: (r.original_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
  }
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
