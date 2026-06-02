// ─── Social Stats ───────────────────────────────────────────────────────────

export interface InstagramStats {
  followers: number
  following: number
  posts: number
  lastFetched: string
}

export interface VideoSummary {
  id: string
  title: string
  views: number
  publishedAt: string
}

export interface YouTubeStats {
  subscribers: number
  totalViews: number
  videoCount: number
  latestVideos: VideoSummary[]
  lastFetched: string
}

export interface LinkedInStats {
  followers: number
  connections: number
  lastFetched: string
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface TopPage {
  path: string
  views: number
}

export interface AnalyticsReport {
  sessions: number
  pageviews: number
  bounceRate: number
  topPages: TopPage[]
  period: '30d'
  lastFetched: string
}

// ─── Trending ────────────────────────────────────────────────────────────────

export type TrendStatus = 'new' | 'used' | 'archived'
export type Platform = 'instagram' | 'youtube' | 'linkedin' | 'all'

export interface TrendItem {
  id: string
  keyword: string
  angle: string
  platform: Platform
  status: TrendStatus
  generatedAt: string
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface AgentSettings {
  agentName: string
  model: string
  systemPromptExtension: string
  mcpToggles: Record<string, boolean>
}

export type AgentDepartment = 'ceo' | 'technical' | 'marketing' | 'finance' | 'psychology'

/** @deprecated Use AgentDepartment instead */
export type AgentLayer = 'executive' | 'marketing' | 'analytics' | 'technical' | 'operations' | 'personal'

export type AgentId =
  // CEO Department
  | 'marcus-ceo'
  | 'diana-coo'
  // Technical Department
  | 'dev-lead'
  | 'raj-backend'
  | 'mia-frontend'
  | 'quinn-qa'
  // Marketing Department
  | 'kai-analyst'
  | 'lena-brand'
  | 'rio-ads'
  | 'nate-growth'
  | 'atlas-art-director'
  | 'pixel-production'
  // Finance Department
  | 'felix-finance'
  // Psychology Department
  | 'daniel-kahneman'

/** @deprecated Use AgentId instead */
export type AgentName =
  | 'marketing-agent'
  | 'coding-agent'
  | 'website-agent'
  | 'trending-analyst'

export type AgentModelTier = 'tier1' | 'synthesis' | 'fast'

export interface AgentConfig {
  id: AgentId
  name: string
  role: string
  department: AgentDepartment
  color: string
  icon: string
  modelTier: AgentModelTier   // tier1=Opus, synthesis=Sonnet, fast=Haiku — resolved from DB config
  personality?: string   // Genius counterpart, e.g. "Shaped by Steve Jobs"
  systemPrompt: string
}

// ─── Venture ─────────────────────────────────────────────────────────────────

export type SocialPlatform =
  | 'instagram' | 'youtube' | 'linkedin' | 'tiktok'
  | 'twitter'   | 'facebook' | 'pinterest'
  | 'github'    | 'discord'  | 'telegram'

export type BrandType = 'ecommerce' | 'saas' | 'agency' | 'media' | 'marketplace'

export type BrandTier =
  | 'budget'
  | 'fast-fashion'
  | 'mid-market'
  | 'contemporary'
  | 'premium'
  | 'luxury'
  | 'ultra-luxury'
export type VentureStatus = 'active' | 'paused' | 'archived'

export interface VentureSocial {
  id: string
  ventureId: string
  platform: SocialPlatform
  handleOrUrl: string
  createdAt: string
}

export interface VentureContext {
  id: string
  name: string
  slug: string
  color: string
  igHandle: string
  ytChannelId: string
  liProfileUrl: string
  ga4PropertyId: string
}

export interface BrandBigIdea {
  brandNameMeaning: string
  idealPerson: string
  idealPersonTraits: string
  gatheringActivity: string
  missionBeyondProduct: string
  platformFocus: 'instagram' | 'tiktok' | 'facebook' | 'threads' | 'all'
}

export type ContentSeriesFormat    = 'reel' | 'carousel' | 'story' | 'collab' | 'mixed'
export type ContentSeriesFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'per-drop'
export type ContentSeriesFanGoal   = 'faithful' | 'advocate' | 'nurtured'

export interface ContentSeries {
  id: string
  ventureId: string
  name: string
  description: string
  format: ContentSeriesFormat
  frequency: ContentSeriesFrequency
  platform: string
  fanGoal: ContentSeriesFanGoal
  active: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface VentureConfig {
  id: string
  name: string
  slug: string
  color: string
  // Legacy integration fields — still used by analytics/briefing routes via env fallback
  igHandle: string
  ytChannelId: string
  liProfileUrl: string
  ga4PropertyId: string
  // Rich profile fields (migration 014)
  description?: string
  tagline?: string
  brandType?: BrandType
  brandTier?: BrandTier
  avgPricePoint?: number
  status?: VentureStatus
  websiteUrl?: string
  logoUrl?: string
  foundedYear?: number
  repoUrl?: string
  localRepoPath?: string
  notionUrl?: string
  updatedAt?: string
  // Content intelligence (migration 020)
  brandBigIdea?: BrandBigIdea
  // Country operations (migration 030)
  operatingCountries?: string[]
  // Market hierarchy — cascading selections stored as breadcrumb paths
  marketSubcategories?: string[]
  // Target audience profile (migration 033)
  targetAudience?: TargetAudience
}

export interface TargetAudience {
  ageRange?: string
  gender?: string
  incomeTier?: string
  region?: 'urban' | 'suburban' | 'rural' | 'all'
  description?: string
}

// ─── Briefs ──────────────────────────────────────────────────────────────────

export interface Brief {
  id: string
  ventureId: string
  content: string
  date: string
  readAt: string | null
  emailSent: boolean
}

// ─── Smart Routing ────────────────────────────────────────────────────────────

export type RoutingIntent =
  | 'strategy'
  | 'marketing_content'
  | 'social_tactics'
  | 'content_create'
  | 'growth_data'
  | 'competitor_intel'
  | 'technical_backend'
  | 'technical_frontend'
  | 'technical_general'
  | 'qa_review'
  | 'trending_content'
  | 'operations'
  | 'product_roadmap'
  | 'advertising'
  | 'github_analysis'
  | 'finance'
  | 'behavioral_audit'
  | 'direct'

export interface RoutingResult {
  intent: RoutingIntent
  specialists: AgentId[]
  reasoning: string
}

export interface SpecialistBriefing {
  agentId: AgentId
  content: string
}

// ─── War Room Execution ───────────────────────────────────────────────────────

export interface ExecutionPlan {
  objective: string
  agents: AgentId[]
  order: 'parallel' | 'sequential'
  each_agent_task: Partial<Record<AgentId, string>>
  definition_of_done: string
}

export type AgentRunStatus = 'idle' | 'working' | 'done' | 'error' | 'retrying'

// ─── War Room Plan History ─────────────────────────────────────────────────────

export interface WarRoomStep {
  id: string
  planId: string
  agentId: AgentId
  taskBrief: string | null
  outputContent: string | null
  status: 'complete' | 'error' | 'retried'
  retryCount: number
  createdAt: string
}

export interface WarRoomPlanRecord {
  id: string
  ventureName: string
  userPrompt: string
  intent: string | null
  objective: string | null
  definitionDone: string | null
  agentOrder: 'parallel' | 'sequential'
  agentsUsed: AgentId[]
  status: 'complete' | 'partial' | 'error'
  synthesis: string | null
  elapsedMs: number | null
  createdAt: string
  steps: WarRoomStep[]
}

// SSE event shapes emitted by /api/team-chat
export type WarRoomEvent =
  | { type: 'routing';        routing: RoutingResult; confidence: number }
  | { type: 'plan';           plan: ExecutionPlan | null; routing: RoutingResult }
  | { type: 'agent_start';    agentId: AgentId; task: string }
  | { type: 'agent_complete'; agentId: AgentId; previewText: string; tokensUsed?: number }
  | { type: 'agent_error';    agentId: AgentId; error: string; fatal: boolean }
  | { type: 'retry';          agentId: AgentId; attempt: number }
  | { type: 'handoff';        from: AgentId; to: AgentId; summary: string }
  | { type: 'autonomy';       agentId: AgentId; level: number; action: string }
  | { type: 'collaboration';  primaryAgent: AgentId; recommendedPartners: AgentId[]; note: string }
  | { type: 'conflicts';      conflicts: ConflictItem[] }
  | { type: 'text';             content: string }
  | { type: 'plan_complete';    elapsed: number }
  | { type: 'error';            message: string }
  | { type: 'tool_call_start';  agentId: AgentId; tool: string; input: unknown; tool_use_id: string }
  | { type: 'tool_call_result'; agentId: AgentId; tool: string; summary: string; is_error: boolean; tool_use_id: string }
  | { type: 'tool_iteration';   agentId: AgentId; n: number }
  | { type: 'github_snapshot';  ok: boolean; repo: string | null; branch: string | null; openIssues: number | null; error: string | null }
  | { type: 'engine';           engine: 'agent_sdk' | 'client_sdk'; fastModel?: string; synthesisModel?: string; provider?: string }
  | { type: 'plan_approval_required'; plan: ExecutionPlan; routing: RoutingResult }
  | { type: 'session_id'; sessionId: string }
  | { type: 'agent_warning'; agentId: AgentId; warning: string; reason: 'max_iterations' | 'timeout'; briefings?: string }

export interface ConflictItem {
  topic: string
  agentA: string
  positionA: string
  agentB: string
  positionB: string
}

// ─── Hermes: Structured Handoff (Phase 0) ────────────────────────────────────

export type HandoffType = 'data' | 'content' | 'strategy' | 'technical' | 'growth' | 'validation'
export type HandoffConfidence = 'high' | 'medium' | 'low'

export interface StructuredHandoff {
  summary: string
  type: HandoffType
  key_output: string
  confidence: HandoffConfidence
}

// ─── Hermes: Agent Memory (Phase 1) ──────────────────────────────────────────

export interface AgentSession {
  id?: string
  agentId: AgentId
  venture: string
  task: string
  outcome: string
  systemTarget: 'system1' | 'system2' | 'mixed' | null
  tokensUsed: number | null
  durationMs: number | null
  sessionSearch?: string   // tsvector — set server-side, not needed in TS
  createdAt?: string
}

export interface StrategyLogEntry {
  id?: string
  brand: string
  surface: string
  lever: string
  layerNumber: number
  variantA: string
  variantB: string
  runRecommendation: 'A' | 'B'
  result: string | null       // null = PENDING
  diagnosis: string | null
  mechanismConfirmed: boolean | null
  nextCycleDirection: string | null
  createdAt?: string
}

export interface LeverTrackerEntry {
  id?: string
  brand: string
  surface: string
  lever: string
  usageCount: number        // 1–3, caps at 3
  capped: boolean
  lastUsed: string
}

export interface BrandPsychologyNote {
  id?: string
  brand: string
  surface: string | null
  category: 'audience' | 'lever' | 'archetype' | 'tone' | 'timing' | 'general'
  note: string
  confidence: HandoffConfidence
  createdAt?: string
}

// ─── Hermes: Skill Registry (Phase 4) ────────────────────────────────────────

export interface SkillRegistryEntry {
  id?: string
  name: string
  agentId: AgentId
  variant: string | null         // 'lean' | 'deep' | null
  category: string
  description: string
  triggerKeywords: string[]
  learnedActivations: LearnedActivation[]
  content: string
  createdAt?: string
}

export interface LearnedActivation {
  date: string
  brand: string
  surface: string
  lever: string
  result: 'worked' | 'failed'
  mechanismNote: string
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AgentSettingsSave {
  agentId: AgentId
  model: string
  systemPromptExtension: string
}

// ─── Command Center ───────────────────────────────────────────────────────────

export interface KpiData {
  label: string
  value: number | string
  delta?: string
  icon?: string
}

export type ActivityType = 'social' | 'agent' | 'trending'

export interface ActivityItem {
  id: string
  timestamp: string
  message: string
  type: ActivityType
}

// ─── Agent Skills ─────────────────────────────────────────────────────────────

export interface AgentSkill {
  id: string
  label: string
  description: string
  trigger: string  // prompt injected into chat when skill is clicked
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus   = 'pending' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  ventureId: string
  agentId?: AgentId
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
}

// ─── Deliverables ─────────────────────────────────────────────────────────────

export type DeliverableType = 'strategy' | 'content' | 'report' | 'design' | 'code'

export interface Deliverable {
  id: string
  ventureId: string
  agentId?: AgentId
  title: string
  type: DeliverableType
  content?: string
  status: string
  createdAt: string
}

// ─── SOPs ─────────────────────────────────────────────────────────────────────

export type SopCategory = 'marketing' | 'technical' | 'operations' | 'design' | 'finance' | 'general'

export interface SopDoc {
  id: string
  ventureId: string
  title: string
  content?: string
  category: SopCategory
  agentId?: AgentId
  createdAt: string
  updatedAt: string
}

// ─── Content Creation ─────────────────────────────────────────────────────────

export type ContentType = 'reel' | 'carousel' | 'post'

export interface ContentSuggestion {
  id: string
  ventureId: string
  platform: 'instagram' | 'linkedin'
  contentType: ContentType
  topic?: string
  caption?: string
  hashtags?: string[][]
  audioSuggestion?: string
  hook?: string
  hookVariants?: string[]
  createdAt: string
}

export interface CompetitorContent {
  id: string
  ventureId: string
  platform: 'instagram' | 'linkedin'
  title?: string
  description?: string
  engagementHint?: string
  sourceUrl?: string
  fetchedAt: string
}

// ─── Content Calendar ───────────────────────────────────────────────────────

export type CalendarPlatform = 'IG' | 'TT' | 'LI' | 'YT'
export type CalendarContentType = 'Reel' | 'Short' | 'Carousel' | 'Post' | 'Article' | 'Static'
export type CalendarStatus = 'planned' | 'in-production' | 'posted' | 'missed' | 'skipped' | 'replanned' | 'auto_post' | 'draft'

export interface ContentCalendarEntry {
  id: string
  ventureId: string
  planDate: string
  contentType: CalendarContentType
  platform: CalendarPlatform
  headline?: string
  brief?: string
  status: CalendarStatus
  assetUrl?: string
  postUrl?: string
  verifiedAt?: string
  originalId?: string
  createdAt: string
}

export interface SocialPostCache {
  id: string
  ventureId: string
  platform: CalendarPlatform
  postUrl?: string
  caption?: string
  postDate: string
  mediaType?: string
  scrapedAt: string
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export type ActivityEventType =
  | 'content_generated'
  | 'task_created'
  | 'task_completed'
  | 'deliverable_saved'
  | 'sop_created'
  | 'trending_refresh'
  | 'brief_generated'
  | 'social_refresh'
  | 'agent_message'

export interface ActivityEvent {
  id: string
  ventureId: string
  agentId?: AgentId
  type: ActivityEventType
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ─── API Payloads ────────────────────────────────────────────────────────────

export interface ClaudeRequestBody {
  agentName?: string
  agentId?: string
  systemPrompt: string
  userMessage: string
  model?: string
  ventureId?: string
  route?: string  // e.g. 'individual-chat' | 'war-room' | 'briefing'
}

// ─── Decisions ────────────────────────────────────────────────────────────────

export type DecisionAction   = 'approved' | 'rejected' | 'deferred'
export type DecisionUrgency  = 'critical' | 'today' | 'this-week'

export interface Decision {
  id: string
  ventureId: string
  agentId: string
  decisionText: string
  question?: string
  actionTaken?: DecisionAction
  urgency: DecisionUrgency
  resolvedAt?: string
  createdAt: string
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export interface DailyLog {
  id: string
  ventureId: string
  agentId: string
  task: string
  outcome?: string
  notes?: string
  logDate: string
  createdAt: string
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

export type RoadmapStatus = 'scoped' | 'in-flight' | 'shipped'

export interface RoadmapItem {
  id: string
  title: string
  priority: string
  status: RoadmapStatus
  dri?: string
  notes?: string
  updatedAt: string
}

// ─── Token Usage ─────────────────────────────────────────────────────────────

export interface TokenUsageRecord {
  id?: string
  agent_id: string | null
  route: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_creation_tokens: number
  cost_usd: number
  venture_id: string | null
  created_at?: string
}

// ─── Phase 1: Brand Pulse ─────────────────────────────────────────────────────

export interface ContentScoreCard {
  id?: string
  ventureId: string
  platform: string
  postId: string
  postUrl?: string
  captionPreview?: string
  reach: number
  likes: number
  comments: number
  saves: number
  shares: number
  engagementRate: number
  saveRate: number
  shareRate: number
  compositeScore: number
  postDate: string
  fetchedAt?: string
}

export interface AnomalyAlert {
  id?: string
  ventureId: string
  alertType: 'reach_drop' | 'engagement_spike' | 'revenue_anomaly' | 'sentiment_shift' | 'algorithm_change'
  metricName: string
  currentValue: number
  baselineValue: number
  changePct: number
  severity: 'critical' | 'warning' | 'info'
  message?: string
  status: 'active' | 'acknowledged' | 'resolved'
  createdAt?: string
}

export interface AudienceMomentumEntry {
  id?: string
  ventureId: string
  platform: string
  weekStart: string
  newFollowers: number
  avgEngagementRate: number
  followerQualityScore: number
  trendDirection?: 'up' | 'down' | 'stable'
  trendDelta: number
}

export interface AttributionPath {
  id?: string
  ventureId: string
  postId: string
  postPlatform: string
  postUrl?: string
  postDate: string
  sessionId?: string
  utmParams?: Record<string, string>
  revenueEventId?: string
  revenueAmount: number
  attributionWeight: number
  conversionType: 'first_touch' | 'last_touch' | 'assisted'
  touchpoints?: Record<string, unknown>[]
}

export interface PlatformScoreWeights {
  reach: number
  saves: number
  shares: number
  comments: number
}

export interface ScorerConfig {
  weights: Record<string, PlatformScoreWeights>
}

export interface BrandPulseOverview {
  ventureId: string
  totalFollowers: number
  totalEngagement: number
  totalRevenue: number
  activeAlerts: number
  contentScores: { top10: ContentScoreCard[]; worst10: ContentScoreCard[] }
  anomalyAlerts: AnomalyAlert[]
  momentum: Record<string, AudienceMomentumEntry[]>
  generatedAt: string
}

// Stripe webhook event
export interface StripeWebhookEvent {
  id?: string
  ventureId: string
  eventType: string
  amount: number
  currency: string
  customerEmail?: string
  customerId?: string
  orderId?: string
  sessionId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  productId?: string
  createdAt?: string
  rawWebhook?: Record<string, unknown>
}

// ─── Content Intelligence ────────────────────────────────────────────────────

export interface ContentPitch {
  id:                 string
  ventureId:          string
  batchId:            string | null
  rank:               number
  platform:           string
  format:             string
  category:           'competitor_gap' | 'unclaimed_territory' | 'blue_ocean'
  intelligenceSource: string | null
  ourMove:            string
  hookA:              string
  hookB:              string
  leverPrimary:       string
  psychologyScore:    number | null
  system1ScoreA:      number | null
  runRecommendation:  string | null
  marketEffect:       string | null
  vsCurrent:          string | null
  viralMechanism:     string | null
  fullProposal:       Record<string, unknown> | null
  status:             'pending' | 'approved' | 'drafted' | 'deployed' | 'passed'
  generatedAt:        string
}

export interface IntelligenceBatch {
  id:           string
  ventureId:    string
  batchNumber:  number
  status:       'generating' | 'complete' | 'failed'
  createdAt:    string
}

// PostHog session
export interface PostHogSession {
  id?: string
  ventureId: string
  sessionId: string
  distinctId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  deviceType?: string
  browser?: string
  country?: string
  pagesViewed: number
  sessionStart?: string
  sessionEnd?: string
  converted: boolean
  conversionValue?: number
  createdAt?: string
}

// ─── Clothing / Outfit Builder ───────────────────────────────────────────────

export interface ClothingItem {
  id:          string
  ventureId:   string
  name:        string
  category:    'top' | 'bottom' | 'outerwear' | 'footwear' | 'accessory'
  description: string
  color:       string
  season:      string
  active:      boolean
  sortOrder:   number
  createdAt:   string
}

export interface SceneOutfit {
  sceneNumber:  number
  top:          { name: string; color: string; styling: string } | null
  bottom:       { name: string; color: string; styling: string } | null
  outerwear:    { name: string; color: string; styling: string } | null
  footwear:     { name: string; color: string; styling: string } | null
  accessory:    { name: string; color: string; styling: string } | null
  stylingNotes: string
  heroItem:     string
}

