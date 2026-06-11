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
  WarRoomPlanRecord,
  WarRoomStep,
  WarRoomToolCall,
  ExecutionPlan,
  AgentSession,
  StrategyLogEntry,
  LeverTrackerEntry,
  BrandPsychologyNote,
  LearnedActivation,
  VentureSocial,
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

function mapVentureRow(r: Record<string, unknown>): VentureConfig {
  return {
    id:            r.id as string,
    name:          r.name as string,
    slug:          r.slug as string,
    color:         (r.color as string) ?? '#E94560',
    igHandle:      (r.ig_handle as string) ?? '',
    ytChannelId:   (r.yt_channel_id as string) ?? '',
    liProfileUrl:  (r.li_profile_url as string) ?? '',
    ga4PropertyId: (r.ga4_property_id as string) ?? '',
    description:   (r.description as string) ?? undefined,
    tagline:       (r.tagline as string) ?? undefined,
    brandType:          (r.brand_type as VentureConfig['brandType']) ?? undefined,
    marketSubcategories: (r.market_subcategories as string[]) ?? undefined,
    status:        ((r.status as string) ?? 'active') as VentureConfig['status'],
    websiteUrl:    (r.website_url as string) ?? undefined,
    logoUrl:       (r.logo_url as string) ?? undefined,
    foundedYear:   (r.founded_year as number) ?? undefined,
    repoUrl:       (r.repo_url as string) ?? undefined,
    localRepoPath: (r.local_repo_path as string) ?? undefined,
    notionUrl:     (r.notion_url as string) ?? undefined,
    updatedAt:          (r.updated_at as string) ?? undefined,
    operatingCountries: (r.operating_countries as string[]) ?? [],
    targetAudience:     r.target_audience ? (r.target_audience as VentureConfig['targetAudience']) : undefined,
    brandTier:          (r.brand_tier as VentureConfig['brandTier']) ?? undefined,
    avgPricePoint:      (r.avg_price_point as number) ?? undefined,
    operatingCities:    (r.operating_cities as string[]) ?? undefined,
    iosAppUrl:          (r.ios_app_url as string) ?? undefined,
    androidAppUrl:      (r.android_app_url as string) ?? undefined,
    hostingPlatform:    (r.hosting_platform as string) ?? undefined,
    productCategories:  r.product_categories ? (r.product_categories as VentureConfig['productCategories']) : undefined,
  }
}

export async function getAllVentures(): Promise<VentureConfig[]> {
  const { data } = await supabase.from('ventures').select('*').order('name')
  return (data ?? []).map(mapVentureRow)
}

export async function getVentureBySlug(slug: string): Promise<VentureConfig | null> {
  const { data } = await supabase.from('ventures').select('*').eq('slug', slug).single()
  return data ? mapVentureRow(data) : null
}

export async function createVenture(data: Omit<VentureConfig, 'id'>): Promise<VentureConfig> {
  const { data: row, error } = await supabase
    .from('ventures')
    .insert({
      name:           data.name,
      slug:           data.slug,
      color:          data.color,
      ig_handle:      data.igHandle,
      yt_channel_id:  data.ytChannelId,
      li_profile_url: data.liProfileUrl,
      ga4_property_id: data.ga4PropertyId,
      description:    data.description,
      tagline:        data.tagline,
      brand_type:     data.brandType,
      market_subcategories: data.marketSubcategories ?? null,
      status:         data.status ?? 'active',
      website_url:    data.websiteUrl,
      logo_url:       data.logoUrl,
      founded_year:   data.foundedYear,
      repo_url:           data.repoUrl,
      notion_url:         data.notionUrl,
      operating_countries: data.operatingCountries ?? [],
      target_audience:     data.targetAudience ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return mapVentureRow(row)
}

export async function updateVenture(
  id: string,
  data: Partial<Omit<VentureConfig, 'id'>>
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.name         !== undefined) update.name            = data.name
  if (data.slug         !== undefined) update.slug            = data.slug
  if (data.color        !== undefined) update.color           = data.color
  if (data.igHandle     !== undefined) update.ig_handle       = data.igHandle
  if (data.ytChannelId  !== undefined) update.yt_channel_id   = data.ytChannelId
  if (data.liProfileUrl !== undefined) update.li_profile_url  = data.liProfileUrl
  if (data.ga4PropertyId !== undefined) update.ga4_property_id = data.ga4PropertyId
  if (data.description  !== undefined) update.description     = data.description
  if (data.tagline      !== undefined) update.tagline         = data.tagline
  if (data.brandType    !== undefined) update.brand_type      = data.brandType
  if (data.marketSubcategories !== undefined) update.market_subcategories = data.marketSubcategories
  if (data.status       !== undefined) update.status          = data.status
  if (data.websiteUrl   !== undefined) update.website_url     = data.websiteUrl
  if (data.logoUrl      !== undefined) update.logo_url        = data.logoUrl
  if (data.foundedYear  !== undefined) update.founded_year    = data.foundedYear
  if (data.repoUrl      !== undefined) update.repo_url        = data.repoUrl
  if (data.localRepoPath       !== undefined) update.local_repo_path      = data.localRepoPath
  if (data.notionUrl           !== undefined) update.notion_url           = data.notionUrl
  if (data.operatingCountries  !== undefined) update.operating_countries  = data.operatingCountries
  if (data.targetAudience      !== undefined) update.target_audience      = data.targetAudience
  if (data.brandTier           !== undefined) update.brand_tier           = data.brandTier
  if (data.avgPricePoint       !== undefined) update.avg_price_point      = data.avgPricePoint
  if (data.operatingCities      !== undefined) update.operating_cities     = data.operatingCities
  if (data.iosAppUrl            !== undefined) update.ios_app_url          = data.iosAppUrl
  if (data.androidAppUrl        !== undefined) update.android_app_url      = data.androidAppUrl
  if (data.hostingPlatform      !== undefined) update.hosting_platform     = data.hostingPlatform
  if (data.productCategories    !== undefined) update.product_categories   = data.productCategories
  await supabase.from('ventures').update(update).eq('id', id)
}

export async function deleteVenture(id: string): Promise<void> {
  await supabase.from('ventures').delete().eq('id', id)
}

// ─── Venture Socials ─────────────────────────────────────────────────────────

export async function getVentureSocials(ventureId: string): Promise<VentureSocial[]> {
  const { data } = await supabase
    .from('venture_socials')
    .select('*')
    .eq('venture_id', ventureId)
    .order('platform')
  return (data ?? []).map((r) => ({
    id:           r.id as string,
    ventureId:    r.venture_id as string,
    platform:     r.platform as VentureSocial['platform'],
    handleOrUrl:  r.handle_or_url as string,
    createdAt:    r.created_at as string,
  }))
}

export async function upsertVentureSocial(
  ventureId: string,
  platform: VentureSocial['platform'],
  handleOrUrl: string
): Promise<VentureSocial> {
  const { data: row, error } = await supabase
    .from('venture_socials')
    .upsert(
      { venture_id: ventureId, platform, handle_or_url: handleOrUrl },
      { onConflict: 'venture_id,platform' }
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return {
    id:          row.id as string,
    ventureId:   row.venture_id as string,
    platform:    row.platform as VentureSocial['platform'],
    handleOrUrl: row.handle_or_url as string,
    createdAt:   row.created_at as string,
  }
}

export async function deleteVentureSocial(id: string): Promise<void> {
  await supabase.from('venture_socials').delete().eq('id', id)
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
    assetUrl: (r.asset_url as string | null) ?? undefined,
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

// ─── War Room Execution Plans ─────────────────────────────────────────────────

export interface SaveWarRoomPlanInput {
  ventureName: string
  userPrompt: string
  intent: string | null
  plan: ExecutionPlan | null
  agentsUsed: AgentId[]
  status: 'complete' | 'partial' | 'error'
  synthesis: string
  elapsedMs: number
  steps: Array<{
    agentId: AgentId
    taskBrief: string | null
    outputContent: string | null
    status: 'complete' | 'error' | 'retried'
    retryCount: number
    toolCalls?: WarRoomToolCall[]
    turnIndex?: number
  }>
  conversationHistory?: Array<{ user: string; marcus: string }>
}

// Trim tool-call payloads before storing. The War Room UI only ever renders
// short fields (file_path, pattern, command, action+path, …) — never the full
// `content` of a write_file — so dropping/capping large strings here avoids
// bloating execution_steps and the history-load payload with zero display loss.
function trimToolInput(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (k === 'content') { out[k] = `[${typeof v === 'string' ? v.length : 0} chars omitted]`; continue }
    if (typeof v === 'string' && v.length > 500) { out[k] = v.slice(0, 500) + '…'; continue }
    out[k] = v
  }
  return out
}

function sanitizeToolCallsForStore(toolCalls?: WarRoomToolCall[]): WarRoomToolCall[] {
  if (!toolCalls || toolCalls.length === 0) return []
  return toolCalls.map(tc => ({
    name:    tc.name,
    isError: tc.isError,
    summary: tc.summary ? tc.summary.slice(0, 500) : null,
    input:   trimToolInput(tc.input),
  }))
}

export async function saveWarRoomPlan(input: SaveWarRoomPlanInput): Promise<string> {
  // Insert the plan row first
  const { data: planRow, error: planErr } = await supabase
    .from('execution_plans')
    .insert({
      venture_name:         input.ventureName,
      user_prompt:          input.userPrompt,
      intent:               input.intent,
      objective:            input.plan?.objective ?? null,
      definition_done:      input.plan?.definition_of_done ?? null,
      agent_order:          input.plan?.order ?? 'parallel',
      agents_used:          input.agentsUsed,
      status:               input.status,
      synthesis:            input.synthesis,
      elapsed_ms:           input.elapsedMs,
      conversation_history: input.conversationHistory ?? [],
    })
    .select('id')
    .single()

  if (planErr ?? !planRow) throw new Error(planErr?.message ?? 'Failed to save plan')

  const planId = planRow.id as string

  // Insert all steps — non-blocking, don't throw on step failure
  if (input.steps.length > 0) {
    await supabase.from('execution_steps').insert(
      input.steps.map(s => ({
        plan_id:        planId,
        agent_id:       s.agentId,
        task_brief:     s.taskBrief,
        output_content: s.outputContent,
        status:         s.status,
        retry_count:    s.retryCount,
        tool_calls:     sanitizeToolCallsForStore(s.toolCalls),
        turn_index:     s.turnIndex ?? 0,
      }))
    )
  }

  return planId
}

export async function updateWarRoomPlan(
  planId: string,
  patch: {
    synthesis?: string
    status?: 'complete' | 'partial' | 'error'
    elapsedMs?: number
    agentsUsed?: AgentId[]
    steps?: SaveWarRoomPlanInput['steps']
    conversationHistory?: Array<{ user: string; marcus: string }>
  }
): Promise<void> {
  await supabase
    .from('execution_plans')
    .update({
      ...(patch.synthesis            !== undefined ? { synthesis:            patch.synthesis            } : {}),
      ...(patch.status               !== undefined ? { status:               patch.status               } : {}),
      ...(patch.elapsedMs            !== undefined ? { elapsed_ms:           patch.elapsedMs            } : {}),
      ...(patch.agentsUsed           !== undefined ? { agents_used:          patch.agentsUsed           } : {}),
      ...(patch.conversationHistory  !== undefined ? { conversation_history: patch.conversationHistory  } : {}),
    })
    .eq('id', planId)

  if (patch.steps && patch.steps.length > 0) {
    await supabase.from('execution_steps').insert(
      patch.steps.map(s => ({
        plan_id:        planId,
        agent_id:       s.agentId,
        task_brief:     s.taskBrief,
        output_content: s.outputContent,
        status:         s.status,
        retry_count:    s.retryCount,
        tool_calls:     sanitizeToolCallsForStore(s.toolCalls),
        turn_index:     s.turnIndex ?? 0,
      }))
    )
  }
}

export async function getWarRoomPlans(
  ventureName: string,
  limit = 20
): Promise<WarRoomPlanRecord[]> {
  const { data: plans } = await supabase
    .from('execution_plans')
    .select('*')
    .eq('venture_name', ventureName)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!plans || plans.length === 0) return []

  const planIds = plans.map(p => p.id as string)

  const { data: steps } = await supabase
    .from('execution_steps')
    .select('*')
    .in('plan_id', planIds)
    .order('created_at', { ascending: true })

  const stepsByPlan = new Map<string, WarRoomStep[]>()
  for (const s of steps ?? []) {
    const list = stepsByPlan.get(s.plan_id as string) ?? []
    list.push({
      id:            s.id as string,
      planId:        s.plan_id as string,
      agentId:       s.agent_id as AgentId,
      taskBrief:     (s.task_brief as string | null) ?? null,
      outputContent: (s.output_content as string | null) ?? null,
      status:        s.status as WarRoomStep['status'],
      retryCount:    (s.retry_count as number) ?? 0,
      toolCalls:     (s.tool_calls as WarRoomToolCall[] | null) ?? [],
      turnIndex:     (s.turn_index as number | null) ?? 0,
      createdAt:     s.created_at as string,
    })
    stepsByPlan.set(s.plan_id as string, list)
  }

  return plans.map(p => ({
    id:                  p.id as string,
    ventureName:         p.venture_name as string,
    userPrompt:          p.user_prompt as string,
    intent:              (p.intent as string | null) ?? null,
    objective:           (p.objective as string | null) ?? null,
    definitionDone:      (p.definition_done as string | null) ?? null,
    agentOrder:          (p.agent_order as 'parallel' | 'sequential') ?? 'parallel',
    agentsUsed:          (p.agents_used as AgentId[]) ?? [],
    status:              p.status as WarRoomPlanRecord['status'],
    synthesis:           (p.synthesis as string | null) ?? null,
    elapsedMs:           (p.elapsed_ms as number | null) ?? null,
    createdAt:           p.created_at as string,
    steps:               stepsByPlan.get(p.id as string) ?? [],
    conversationHistory: (p.conversation_history as Array<{ user: string; marcus: string }>) ?? [],
  }))
}

export async function deleteWarRoomPlan(planId: string): Promise<void> {
  await supabase.from('execution_steps').delete().eq('plan_id', planId)
  await supabase.from('execution_plans').delete().eq('id', planId)
}

export async function deleteAllWarRoomPlans(ventureName: string): Promise<void> {
  const { data: plans } = await supabase
    .from('execution_plans')
    .select('id')
    .eq('venture_name', ventureName)
  if (plans && plans.length > 0) {
    const ids = plans.map(p => p.id as string)
    await supabase.from('execution_steps').delete().in('plan_id', ids)
  }
  await supabase.from('execution_plans').delete().eq('venture_name', ventureName)
}

// ─── Hermes: Agent Session Memory ─────────────────────────────────────────────

export async function saveAgentSession(s: Omit<AgentSession, 'id' | 'createdAt'>): Promise<void> {
  await supabase.from('agent_sessions').insert({
    agent_id:      s.agentId,
    venture:       s.venture,
    task:          s.task,
    outcome:       s.outcome,
    system_target: s.systemTarget ?? null,
    tokens_used:   s.tokensUsed ?? null,
    duration_ms:   s.durationMs ?? null,
  })
}

export async function getAgentSessions(
  agentId: AgentId,
  venture: string,
  limit = 5
): Promise<AgentSession[]> {
  const { data } = await supabase
    .from('agent_sessions')
    .select('id, agent_id, venture, task, outcome, system_target, tokens_used, duration_ms, created_at')
    .eq('agent_id', agentId)
    .eq('venture', venture)
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(r => ({
    id:           r.id as string,
    agentId:      r.agent_id as AgentId,
    venture:      r.venture as string,
    task:         r.task as string,
    outcome:      r.outcome as string,
    systemTarget: (r.system_target as AgentSession['systemTarget']) ?? null,
    tokensUsed:   (r.tokens_used as number | null) ?? null,
    durationMs:   (r.duration_ms as number | null) ?? null,
    createdAt:    r.created_at as string,
  }))
}

export async function searchAgentSessions(
  query: string,
  venture: string,
  limit = 10
): Promise<AgentSession[]> {
  const { data } = await supabase
    .from('agent_sessions')
    .select('id, agent_id, venture, task, outcome, system_target, tokens_used, duration_ms, created_at')
    .eq('venture', venture)
    .textSearch('session_search', query, { type: 'websearch', config: 'english' })
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []).map(r => ({
    id:           r.id as string,
    agentId:      r.agent_id as AgentId,
    venture:      r.venture as string,
    task:         r.task as string,
    outcome:      r.outcome as string,
    systemTarget: (r.system_target as AgentSession['systemTarget']) ?? null,
    tokensUsed:   (r.tokens_used as number | null) ?? null,
    durationMs:   (r.duration_ms as number | null) ?? null,
    createdAt:    r.created_at as string,
  }))
}

// ─── Hermes: Strategy Log ─────────────────────────────────────────────────────

export async function saveStrategyLog(
  entry: Omit<StrategyLogEntry, 'id' | 'createdAt'>
): Promise<string> {
  const { data, error } = await supabase
    .from('strategy_log')
    .insert({
      brand:               entry.brand,
      surface:             entry.surface,
      lever:               entry.lever,
      layer_number:        entry.layerNumber,
      variant_a:           entry.variantA,
      variant_b:           entry.variantB,
      run_recommendation:  entry.runRecommendation,
      result:              entry.result ?? null,
      diagnosis:           entry.diagnosis ?? null,
      mechanism_confirmed: entry.mechanismConfirmed ?? null,
      next_cycle_direction:entry.nextCycleDirection ?? null,
    })
    .select('id')
    .single()
  if (error ?? !data) throw new Error('Failed to save strategy log')
  return data.id as string
}

export async function getPendingStrategyLogs(brand: string): Promise<StrategyLogEntry[]> {
  const { data } = await supabase
    .from('strategy_log')
    .select('*')
    .eq('brand', brand)
    .is('result', null)
    .order('created_at', { ascending: false })
  return (data ?? []).map(mapStrategyLog)
}

export async function updateStrategyLogResult(
  id: string,
  result: string,
  diagnosis: string,
  mechanismConfirmed: boolean,
  nextCycleDirection: string
): Promise<void> {
  await supabase.from('strategy_log').update({
    result,
    diagnosis,
    mechanism_confirmed:  mechanismConfirmed,
    next_cycle_direction: nextCycleDirection,
  }).eq('id', id)
}

export async function getStrategyLog(brand: string, surface?: string, limit = 10): Promise<StrategyLogEntry[]> {
  let q = supabase.from('strategy_log').select('*').eq('brand', brand)
  if (surface) q = q.eq('surface', surface)
  const { data } = await q.order('created_at', { ascending: false }).limit(limit)
  return (data ?? []).map(mapStrategyLog)
}

function mapStrategyLog(r: Record<string, unknown>): StrategyLogEntry {
  return {
    id:                  r.id as string,
    brand:               r.brand as string,
    surface:             r.surface as string,
    lever:               r.lever as string,
    layerNumber:         r.layer_number as number,
    variantA:            r.variant_a as string,
    variantB:            r.variant_b as string,
    runRecommendation:   r.run_recommendation as 'A' | 'B',
    result:              (r.result as string | null) ?? null,
    diagnosis:           (r.diagnosis as string | null) ?? null,
    mechanismConfirmed:  (r.mechanism_confirmed as boolean | null) ?? null,
    nextCycleDirection:  (r.next_cycle_direction as string | null) ?? null,
    createdAt:           r.created_at as string,
  }
}

// ─── Hermes: Lever Tracker ────────────────────────────────────────────────────

export async function getLeverTracker(brand: string, surface: string): Promise<LeverTrackerEntry | null> {
  const { data } = await supabase
    .from('lever_tracker')
    .select('*')
    .eq('brand', brand)
    .eq('surface', surface)
    .single()
  if (!data) return null
  return {
    id:         data.id as string,
    brand:      data.brand as string,
    surface:    data.surface as string,
    lever:      data.lever as string,
    usageCount: data.usage_count as number,
    capped:     data.capped as boolean,
    lastUsed:   data.last_used as string,
  }
}

export async function updateLeverTracker(
  brand: string,
  surface: string,
  lever: string
): Promise<{ capped: boolean; count: number }> {
  const existing = await getLeverTracker(brand, surface)

  if (!existing || existing.lever !== lever) {
    // New lever — reset count to 1
    await supabase.from('lever_tracker').upsert({
      brand, surface, lever,
      usage_count: 1,
      capped:      false,
      last_used:   new Date().toISOString(),
    }, { onConflict: 'brand,surface' })
    return { capped: false, count: 1 }
  }

  // Same lever — increment, cap at 3
  const newCount = Math.min(existing.usageCount + 1, 3)
  const capped   = newCount >= 3
  await supabase.from('lever_tracker').update({
    usage_count: newCount,
    capped,
    last_used:   new Date().toISOString(),
  }).eq('brand', brand).eq('surface', surface)

  return { capped, count: newCount }
}

// ─── Hermes: Brand Psychology ─────────────────────────────────────────────────

export async function saveBrandPsychologyNote(
  note: Omit<BrandPsychologyNote, 'id' | 'createdAt'>
): Promise<void> {
  await supabase.from('brand_psychology').insert({
    brand:      note.brand,
    surface:    note.surface ?? null,
    category:   note.category,
    note:       note.note,
    confidence: note.confidence,
  })
}

export async function getBrandPsychology(
  brand: string,
  category?: BrandPsychologyNote['category'],
  limit = 20
): Promise<BrandPsychologyNote[]> {
  let q = supabase.from('brand_psychology').select('*').eq('brand', brand)
  if (category) q = q.eq('category', category)
  const { data } = await q.order('created_at', { ascending: false }).limit(limit)
  return (data ?? []).map(r => ({
    id:         r.id as string,
    brand:      r.brand as string,
    surface:    (r.surface as string | null) ?? null,
    category:   r.category as BrandPsychologyNote['category'],
    note:       r.note as string,
    confidence: r.confidence as BrandPsychologyNote['confidence'],
    createdAt:  r.created_at as string,
  }))
}

// ─── Hermes: Skill Registry ───────────────────────────────────────────────────

export async function searchSkills(
  keywords: string[],
  agentId?: AgentId,
  limit = 5
): Promise<Array<{ id: string; name: string; variant: string | null; description: string; triggerKeywords: string[] }>> {
  let q = supabase
    .from('skills')
    .select('id, name, variant, description, trigger_keywords')
    .contains('trigger_keywords', keywords)  // GIN overlap: any keyword matches
  if (agentId) q = q.eq('agent_id', agentId)
  const { data } = await q.limit(limit)
  return (data ?? []).map(r => ({
    id:              r.id as string,
    name:            r.name as string,
    variant:         (r.variant as string | null) ?? null,
    description:     r.description as string,
    triggerKeywords: (r.trigger_keywords as string[]) ?? [],
  }))
}

export async function appendLearnedActivation(
  skillName: string,
  activation: LearnedActivation
): Promise<void> {
  // Read current array, append, write back — Supabase jsonb_array_append via RPC
  const { data } = await supabase
    .from('skills')
    .select('learned_activations')
    .eq('name', skillName)
    .single()

  const current: LearnedActivation[] = (data?.learned_activations as LearnedActivation[]) ?? []
  // Keep last 50 activations only — prevents unbounded growth
  const updated = [...current, activation].slice(-50)

  await supabase.from('skills').update({ learned_activations: updated }).eq('name', skillName)
}

// ─── Hermes: Memory Prefetch ───────────────────────────────────────────────────
// Phase C: Fetches top-3 most relevant past sessions for an agent via FTS.
// Returns a formatted <memory-context> block for injection into specialist prompts.

export async function prefetchAgentMemory(
  agentId: AgentId,
  venture: string,
  query: string,
): Promise<string> {
  try {
    // FTS search for relevant past sessions by this agent
    const { data } = await supabase
      .from('agent_sessions')
      .select('task, outcome, created_at, venture')
      .eq('agent_id', agentId)
      .eq('venture', venture)
      .textSearch('session_search', query, { type: 'websearch', config: 'english' })
      .order('created_at', { ascending: false })
      .limit(3)

    if (!data || data.length === 0) return ''

    const entries = data.map((r, i) => {
      const date = (r.created_at as string).slice(0, 10)
      const v    = (r.venture as string | null) ?? 'unknown'
      return `${i + 1}. [${date}][${v}] Task: ${(r.task as string).slice(0, 80)} → ${(r.outcome as string).slice(0, 120)}`
    }).join('\n')

    return `<memory-context>\n[System note: The following is recalled memory context, NOT new user input. Treat as informational background data.]\n\n## Relevant Past Sessions\n${entries}\n</memory-context>`
  } catch {
    return ''
  }
}

// ─── Hermes: Skill Usage Tracking ─────────────────────────────────────────────
// Phase E: Increments use_count and sets last_used_at when a skill is fetched.

export async function trackSkillUsage(skillName: string): Promise<void> {
  try {
    await supabase.rpc('increment_skill_usage', { skill_name: skillName })
  } catch {
    // Non-fatal — usage tracking should never break skill search
  }
}

// ─── Hermes: Skill Lifecycle Transition ──────────────────────────────────────
// Phase F: Transitions skills from active→stale→archived based on last_used_at.
// Called by calibration cron (Fridays). Pinned skills are never transitioned.

export async function runSkillLifecycleTransitions(): Promise<{ staled: number; archived: number }> {
  const staleThreshold    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const archiveThreshold  = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // active → stale: unused for 30+ days — fetch IDs first then update
  const { data: staleRows } = await supabase
    .from('skills')
    .select('id')
    .eq('lifecycle_state', 'active')
    .eq('pinned', false)
    .or(`last_used_at.lt.${staleThreshold},last_used_at.is.null`)

  const staleIds = (staleRows ?? []).map(r => r.id as string)
  if (staleIds.length > 0) {
    await supabase.from('skills').update({ lifecycle_state: 'stale' }).in('id', staleIds)
  }

  // stale → archived: unused for 90+ days
  const { data: archiveRows } = await supabase
    .from('skills')
    .select('id')
    .eq('lifecycle_state', 'stale')
    .eq('pinned', false)
    .or(`last_used_at.lt.${archiveThreshold},last_used_at.is.null`)

  const archiveIds = (archiveRows ?? []).map(r => r.id as string)
  if (archiveIds.length > 0) {
    await supabase.from('skills').update({ lifecycle_state: 'archived' }).in('id', archiveIds)
  }

  return { staled: staleIds.length, archived: archiveIds.length }
}

// ─── Growth Intelligence: Snapshots + Baselines ───────────────────────────────

export interface SocialSnapshot {
  id: string
  ventureId: string
  platform: 'instagram' | 'youtube' | 'linkedin'
  capturedAt: string
  data: Record<string, unknown>
}

export interface AnalyticsSnapshot {
  id: string
  ventureId: string
  capturedAt: string
  periodStart: string | null
  periodEnd: string | null
  data: Record<string, unknown>
}

export interface CompetitorSnapshot {
  id: string
  ventureId: string
  platform: string
  competitorUrl: string | null
  capturedAt: string
  rawContent: Record<string, unknown>
  kaiAnalysis: Record<string, unknown> | null
}

export interface GrowthBaseline {
  id: string
  ventureId: string
  platform: string
  metricKey: string
  baselineValue: number
  baselineDate: string
  setBy: string
  notes: string | null
  createdAt: string
}

export interface GrowthPoint {
  capturedAt: string
  value: number
}

export interface GrowthMetric {
  platform: string
  metricKey: string
  baseline: Pick<GrowthBaseline, 'baselineValue' | 'baselineDate' | 'setBy'> | null
  currentValue: number | null
  currentCapturedAt: string | null
  growthPct: number | null
  history: GrowthPoint[]
}

// Extract the primary trackable metric from a social payload
function extractSocialMetric(
  platform: 'instagram' | 'youtube' | 'linkedin',
  data: Record<string, unknown>
): { metricKey: string; value: number } | null {
  switch (platform) {
    case 'instagram': {
      const v = data.followersCount ?? data.followers ?? data.follower_count
      return typeof v === 'number' ? { metricKey: 'followers', value: v } : null
    }
    case 'youtube': {
      const v = data.subscriberCount ?? data.subscribers
      return typeof v === 'number' ? { metricKey: 'subscribers', value: v } : null
    }
    case 'linkedin': {
      const v = data.followerCount ?? data.followers ?? data.followersCount
      return typeof v === 'number' ? { metricKey: 'followers', value: v } : null
    }
  }
}

function extractAnalyticsMetric(data: Record<string, unknown>): number | null {
  const v = data.sessions ?? data.totalSessions
  return typeof v === 'number' ? v : null
}

// ─── Social Snapshots ─────────────────────────────────────────────────────────

export async function insertSocialSnapshot(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  data: Record<string, unknown>
): Promise<void> {
  await supabase.from('social_snapshots').insert({
    venture_id:  ventureId,
    platform,
    data,
    captured_at: new Date().toISOString(),
  })

  // Auto-set baseline on first snapshot only (ignoreDuplicates = ON CONFLICT DO NOTHING)
  const metric = extractSocialMetric(platform, data)
  if (metric) {
    await supabase.from('growth_baselines').upsert(
      {
        venture_id:     ventureId,
        platform,
        metric_key:     metric.metricKey,
        baseline_value: metric.value,
        baseline_date:  new Date().toISOString().split('T')[0],
        set_by:         'auto',
      },
      { onConflict: 'venture_id,platform,metric_key', ignoreDuplicates: true }
    )
  }
}

export async function getSocialHistory(
  ventureId: string,
  platform: 'instagram' | 'youtube' | 'linkedin',
  days = 30
): Promise<SocialSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('social_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
  return (data ?? []).map(r => ({
    id:         r.id as string,
    ventureId:  r.venture_id as string,
    platform:   r.platform as SocialSnapshot['platform'],
    capturedAt: r.captured_at as string,
    data:       r.data as Record<string, unknown>,
  }))
}

// ─── Analytics Snapshots ──────────────────────────────────────────────────────

export async function insertAnalyticsSnapshot(
  ventureId: string,
  data: Record<string, unknown>,
  periodStart?: string,
  periodEnd?: string
): Promise<void> {
  await supabase.from('analytics_snapshots').insert({
    venture_id:   ventureId,
    data,
    period_start: periodStart ?? null,
    period_end:   periodEnd ?? null,
    captured_at:  new Date().toISOString(),
  })

  // Auto-set baseline on first snapshot only
  const sessions = extractAnalyticsMetric(data)
  if (sessions != null) {
    await supabase.from('growth_baselines').upsert(
      {
        venture_id:     ventureId,
        platform:       'ga4',
        metric_key:     'sessions',
        baseline_value: sessions,
        baseline_date:  new Date().toISOString().split('T')[0],
        set_by:         'auto',
      },
      { onConflict: 'venture_id,platform,metric_key', ignoreDuplicates: true }
    )
  }
}

export async function getAnalyticsHistory(
  ventureId: string,
  days = 30
): Promise<AnalyticsSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
  return (data ?? []).map(r => ({
    id:          r.id as string,
    ventureId:   r.venture_id as string,
    capturedAt:  r.captured_at as string,
    periodStart: (r.period_start as string | null) ?? null,
    periodEnd:   (r.period_end as string | null) ?? null,
    data:        r.data as Record<string, unknown>,
  }))
}

// ─── Competitor Snapshots ─────────────────────────────────────────────────────

export async function insertCompetitorSnapshot(
  ventureId: string,
  platform: string,
  rawContent: Record<string, unknown>,
  competitorUrl?: string,
  kaiAnalysis?: Record<string, unknown>
): Promise<void> {
  await supabase.from('competitor_snapshots').insert({
    venture_id:     ventureId,
    platform,
    competitor_url: competitorUrl ?? null,
    raw_content:    rawContent,
    kai_analysis:   kaiAnalysis ?? null,
    captured_at:    new Date().toISOString(),
  })
}

export async function getCompetitorHistory(
  ventureId: string,
  platform: string,
  days = 90
): Promise<CompetitorSnapshot[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('platform', platform)
    .gte('captured_at', since)
    .order('captured_at', { ascending: false })
    .limit(50)
  return (data ?? []).map(r => ({
    id:            r.id as string,
    ventureId:     r.venture_id as string,
    platform:      r.platform as string,
    competitorUrl: (r.competitor_url as string | null) ?? null,
    capturedAt:    r.captured_at as string,
    rawContent:    r.raw_content as Record<string, unknown>,
    kaiAnalysis:   (r.kai_analysis as Record<string, unknown> | null) ?? null,
  }))
}

// ─── Growth Baselines ─────────────────────────────────────────────────────────

export async function getGrowthBaselines(ventureId: string): Promise<GrowthBaseline[]> {
  const { data } = await supabase
    .from('growth_baselines')
    .select('*')
    .eq('venture_id', ventureId)
    .order('platform')
  return (data ?? []).map(r => ({
    id:            r.id as string,
    ventureId:     r.venture_id as string,
    platform:      r.platform as string,
    metricKey:     r.metric_key as string,
    baselineValue: r.baseline_value as number,
    baselineDate:  r.baseline_date as string,
    setBy:         r.set_by as string,
    notes:         (r.notes as string | null) ?? null,
    createdAt:     r.created_at as string,
  }))
}

export async function setGrowthBaseline(
  ventureId: string,
  platform: string,
  metricKey: string,
  value: number,
  notes?: string
): Promise<void> {
  await supabase.from('growth_baselines').upsert(
    {
      venture_id:     ventureId,
      platform,
      metric_key:     metricKey,
      baseline_value: value,
      baseline_date:  new Date().toISOString().split('T')[0],
      set_by:         'stark',
      notes:          notes ?? null,
    },
    { onConflict: 'venture_id,platform,metric_key' }
  )
}

// ─── Growth Summary ───────────────────────────────────────────────────────────

export async function getGrowthSummary(ventureId: string): Promise<GrowthMetric[]> {
  const baselines = await getGrowthBaselines(ventureId)
  if (baselines.length === 0) return []

  const metrics: GrowthMetric[] = []

  for (const baseline of baselines) {
    if (baseline.platform === 'ga4') {
      const history = await getAnalyticsHistory(ventureId, 30)
      const points: GrowthPoint[] = history
        .map(s => {
          const val = extractAnalyticsMetric(s.data)
          return val != null ? { capturedAt: s.capturedAt, value: val } : null
        })
        .filter((p): p is GrowthPoint => p !== null)

      const latest = points.at(-1) ?? null
      const growthPct = latest != null && baseline.baselineValue !== 0
        ? Math.round(((latest.value - baseline.baselineValue) / baseline.baselineValue) * 1000) / 10
        : null

      metrics.push({
        platform:          'ga4',
        metricKey:         baseline.metricKey,
        baseline:          { baselineValue: baseline.baselineValue, baselineDate: baseline.baselineDate, setBy: baseline.setBy },
        currentValue:      latest?.value ?? null,
        currentCapturedAt: latest?.capturedAt ?? null,
        growthPct,
        history:           points,
      })
    } else {
      const platform = baseline.platform as 'instagram' | 'youtube' | 'linkedin'
      const history = await getSocialHistory(ventureId, platform, 30)
      const points: GrowthPoint[] = history
        .map(s => {
          const metric = extractSocialMetric(platform, s.data)
          return metric ? { capturedAt: s.capturedAt, value: metric.value } : null
        })
        .filter((p): p is GrowthPoint => p !== null)

      const latest = points.at(-1) ?? null
      const growthPct = latest != null && baseline.baselineValue !== 0
        ? Math.round(((latest.value - baseline.baselineValue) / baseline.baselineValue) * 1000) / 10
        : null

      metrics.push({
        platform:          baseline.platform,
        metricKey:         baseline.metricKey,
        baseline:          { baselineValue: baseline.baselineValue, baselineDate: baseline.baselineDate, setBy: baseline.setBy },
        currentValue:      latest?.value ?? null,
        currentCapturedAt: latest?.capturedAt ?? null,
        growthPct,
        history:           points,
      })
    }
  }

  return metrics
}

// ─── Hermes: Insights ─────────────────────────────────────────────────────────
// Phase G: Aggregates agent session data for the /api/insights endpoint.

export async function getInsights(
  venture: string,
  days: number,
  agentId?: AgentId,
): Promise<{
  totalTokens: number
  totalCostUsd: number
  sessionCount: number
  byAgent: Array<{ agentId: string; tokens: number; costUsd: number; sessions: number }>
  byDay: Array<{ date: string; tokens: number; costUsd: number }>
  topSkills: Array<{ name: string; useCount: number; lastUsedAt: string | null; lifecycleState: string }>
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  let sessionQ = supabase
    .from('agent_sessions')
    .select('agent_id, tokens_used, cost_usd, created_at')
    .eq('venture', venture)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (agentId) sessionQ = sessionQ.eq('agent_id', agentId)

  const { data: sessions } = await sessionQ

  const rows = sessions ?? []
  const totalTokens  = rows.reduce((s, r) => s + ((r.tokens_used as number) || 0), 0)
  const totalCostUsd = rows.reduce((s, r) => s + ((r.cost_usd as number) || 0), 0)

  // By agent
  const agentMap: Record<string, { tokens: number; costUsd: number; sessions: number }> = {}
  for (const r of rows) {
    const id = r.agent_id as string
    if (!agentMap[id]) agentMap[id] = { tokens: 0, costUsd: 0, sessions: 0 }
    agentMap[id].tokens   += (r.tokens_used as number) || 0
    agentMap[id].costUsd  += (r.cost_usd as number)    || 0
    agentMap[id].sessions += 1
  }

  // By day
  const dayMap: Record<string, { tokens: number; costUsd: number }> = {}
  for (const r of rows) {
    const day = (r.created_at as string).slice(0, 10)
    if (!dayMap[day]) dayMap[day] = { tokens: 0, costUsd: 0 }
    dayMap[day].tokens  += (r.tokens_used as number) || 0
    dayMap[day].costUsd += (r.cost_usd as number)    || 0
  }

  // Top skills
  const { data: skillsData } = await supabase
    .from('skills')
    .select('name, use_count, last_used_at, lifecycle_state')
    .order('use_count', { ascending: false })
    .limit(10)

  return {
    totalTokens,
    totalCostUsd,
    sessionCount:  rows.length,
    byAgent:       Object.entries(agentMap).map(([id, v]) => ({ agentId: id, ...v })),
    byDay:         Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v })),
    topSkills:     (skillsData ?? []).map(r => ({
      name:            r.name as string,
      useCount:        (r.use_count as number) || 0,
      lastUsedAt:      (r.last_used_at as string | null) ?? null,
      lifecycleState:  (r.lifecycle_state as string) || 'active',
    })),
  }
}
