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

export type AgentLayer = 'executive' | 'marketing' | 'analytics' | 'technical' | 'operations' | 'personal'

export type AgentId =
  // Executive
  | 'marcus-ceo'
  | 'diana-coo'
  // Marketing
  | 'sofia-social'
  | 'lena-brand'
  | 'rio-ads'
  | 'atlas-art-director'
  | 'pixel-production'
  // Analytics
  | 'kai-analyst'
  | 'zara-competitor'
  | 'nate-growth'
  | 'venture-scout'
  // Technical
  | 'dev-lead'
  | 'raj-backend'
  | 'mia-frontend'
  | 'quinn-qa'
  // Operations
  | 'felix-finance'
  // Personal
  | 'stark-growth'

/** @deprecated Use AgentId instead */
export type AgentName =
  | 'marketing-agent'
  | 'coding-agent'
  | 'website-agent'
  | 'trending-analyst'

export interface AgentConfig {
  id: AgentId
  name: string
  role: string
  layer: AgentLayer
  color: string
  icon: string
  model: string
  personality?: string   // Genius counterpart, e.g. "Shaped by Steve Jobs"
  systemPrompt: string
  webSearch?: boolean
}

// ─── Venture ─────────────────────────────────────────────────────────────────

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

export interface VentureConfig {
  id: string
  name: string
  slug: string
  color: string
  igHandle: string
  ytChannelId: string
  liProfileUrl: string
  ga4PropertyId: string
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

export interface RoutingResult {
  intent: RoutingIntent
  specialists: AgentId[]
  reasoning: string
}

export interface SpecialistBriefing {
  agentId: AgentId
  content: string
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
export type CalendarStatus = 'planned' | 'in-production' | 'posted' | 'missed' | 'skipped' | 'replanned'

export interface ContentCalendarEntry {
  id: string
  ventureId: string
  planDate: string
  contentType: CalendarContentType
  platform: CalendarPlatform
  headline?: string
  brief?: string
  status: CalendarStatus
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
