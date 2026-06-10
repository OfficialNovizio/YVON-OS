/**
 * Analytics Dashboard — Venture Rotation Context
 *
 * Defines how the Analytics dashboard reconfigures based on the active venture.
 * Novizio (fashion DTC) and Hourbour (fintech SaaS) have fundamentally different
 * Foundation for new tabs communicating which venture-specific context to load.
 */
import type React from 'react'

export type AnalyticsVenture = 'novizio' | 'hourbour' | 'yvon-os'

export interface VentureAnalyticsProfile {
  slug: AnalyticsVenture
  name: string
  industry: string

  // Platform emphasis
  primaryPlatform: { name: string; icon: string; color: string }
  secondaryPlatforms: { name: string; icon: string; color: string }[]

  // Metrics that appear on KPI strips
  kpiMetrics: { label: string; key: string; format: 'currency' | 'percentage' | 'number' | 'ratio'; alertGood: 'higher' | 'lower' }[]

  // Kai's Read focus
  kaiFocus: string

  // Market tab framing
  marketFraming: {
    tamLabel: string
    growthLabel: string
    personaLabel: string
  }

  // Social tab emphasis
  socialEmphasis: string

  // Brand color for accenting
  accentColor: string

  // Empty state messaging
  emptyState: {
    title: string
    body: string
    action: string
  }
}

export const NOVIZIO_PROFILE: VentureAnalyticsProfile = {
  slug: 'novizio',
  name: 'Novizio',
  industry: 'Fashion DTC',
  primaryPlatform: { name: 'Instagram', icon: 'photo_camera', color: '#E1306C' },
  secondaryPlatforms: [
    { name: 'TikTok', icon: 'music_note', color: '#00f2ea' },
    { name: 'YouTube', icon: 'play_circle', color: '#FF0000' },
  ],
  kpiMetrics: [
    { label: 'Engagement Rate', key: 'engagement_rate', format: 'percentage', alertGood: 'higher' },
    { label: 'Followers', key: 'followers', format: 'number', alertGood: 'higher' },
    { label: 'ROAS', key: 'roas', format: 'ratio', alertGood: 'higher' },
    { label: 'Reels Reach', key: 'reels_reach', format: 'number', alertGood: 'higher' },
  ],
  kaiFocus: 'Instagram engagement · follower growth · Reels vs static · content virality · ROAS trends',
  marketFraming: {
    tamLabel: 'Fashion DTC Market',
    growthLabel: 'Customer Growth (GA4 + Social)',
    personaLabel: 'Buyer Personas',
  },
  socialEmphasis: 'Visual-first platforms: Instagram, TikTok. Content format matters as much as volume.',
  accentColor: '#E1306C',
  emptyState: {
    title: 'No Social Accounts Connected',
    body: 'Connect your Instagram, TikTok, or YouTube accounts to see live fashion brand analytics.',
    action: 'Connect Instagram',
  },
}

export const HOURBOUR_PROFILE: VentureAnalyticsProfile = {
  slug: 'hourbour',
  name: 'Hourbour',
  industry: 'Fintech SaaS',
  primaryPlatform: { name: 'LinkedIn', icon: 'work', color: '#0a66c2' },
  secondaryPlatforms: [
    { name: 'YouTube', icon: 'play_circle', color: '#FF0000' },
  ],
  kpiMetrics: [
    { label: 'MRR', key: 'mrr', format: 'currency', alertGood: 'higher' },
    { label: 'Churn Rate', key: 'churn', format: 'percentage', alertGood: 'lower' },
    { label: 'Trial → Paid', key: 'trial_conversion', format: 'percentage', alertGood: 'higher' },
    { label: 'LTV:CAC', key: 'ltv_cac', format: 'ratio', alertGood: 'higher' },
  ],
  kaiFocus: 'LinkedIn engagement · app retention · churn signals · trial-to-paid conversion · MRR trajectory',
  marketFraming: {
    tamLabel: 'Fintech SaaS Market',
    growthLabel: 'User Growth (App Sessions)',
    personaLabel: 'User Personas',
  },
  socialEmphasis: 'Professional platforms: LinkedIn. Focus on thought leadership and trust signals.',
  accentColor: '#0a66c2',
  emptyState: {
    title: 'No Accounts Connected',
    body: 'Connect your LinkedIn or YouTube accounts to see live fintech analytics.',
    action: 'Connect LinkedIn',
  },
}

const YVON_OS_PROFILE: VentureAnalyticsProfile = {
  slug: 'yvon-os',
  name: 'YVON OS',
  industry: 'Internal BI',
  primaryPlatform: { name: 'Dashboard', icon: 'dashboard', color: '#0066cc' },
  secondaryPlatforms: [],
  kpiMetrics: [
    { label: 'Token Usage', key: 'tokens', format: 'number', alertGood: 'lower' },
    { label: 'Agent Sessions', key: 'sessions', format: 'number', alertGood: 'higher' },
    { label: 'API Cost', key: 'api_cost', format: 'currency', alertGood: 'lower' },
  ],
  kaiFocus: 'System health · token consumption · agent activity · error rates',
  marketFraming: {
    tamLabel: 'System Overview',
    growthLabel: 'Usage Growth',
    personaLabel: 'Agent Activity',
  },
  socialEmphasis: 'Internal metrics only.',
  accentColor: '#0066cc',
  emptyState: {
    title: 'System Dashboard',
    body: 'YVON OS analytics — internal platform health.',
    action: 'View System',
  },
}

export function getVentureProfile(slug: string): VentureAnalyticsProfile {
  switch (slug) {
    case 'hourbour': return HOURBOUR_PROFILE
    case 'novizio': return NOVIZIO_PROFILE
    default: return YVON_OS_PROFILE
  }
}

/**
 * Returns the accent color for the active venture, usable as a CSS variable override
 * or inline style. Falls back to YVON blue (#0066cc) if unknown.
 */
export function getVentureAccent(slug: string): string {
  return getVentureProfile(slug).accentColor
}
