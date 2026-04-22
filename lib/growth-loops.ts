// Growth Loops — the 4 compounding feedback loops that drive J-curve growth
// Loop 1: Content Flywheel | Loop 2: Competitor Exploit | Loop 3: Revenue Attribution | Loop 4: Audience Intelligence

import 'server-only'

export interface ContentFlywheelOutput {
  topContentId: string
  insights: string[]
  variants: Array<{
    platform: string
    hook: string
    caption: string
    format: string
    hashtagCluster: string[]
  }>
  learnings: string
}

export interface CompetitorExploitBrief {
  territory: string
  recommendedPosts: Array<{
    title: string
    hook: string
    platform: string
    timing: string
  }>
  urgency: 'high' | 'medium' | 'low'
}

export interface RevenueAttributionInsight {
  topRevenuePost: {
    postId: string
    platform: string
    revenue: number
  }
  recommendation: string
  roiByFormat: Record<string, number>
}

export interface AudienceDesireBrief {
  desire: string
  extractedFrom: string[]
  suggestedContent: {
    title: string
    hook: string
    audienceLanguage: string
  }
  urgency: 'high' | 'medium' | 'low'
}
