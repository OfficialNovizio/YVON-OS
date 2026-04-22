import type { VentureConfig } from '@/lib/types'

const COOKIE_NAME = 'yvon_active_venture'

// ─── Server-side (cookies from next/headers) ──────────────────────────────────

export function getActiveVentureSlug(
  cookieStore: { get: (name: string) => { value: string } | undefined }
): string {
  return cookieStore.get(COOKIE_NAME)?.value ?? 'novizio'
}

// ─── Client-side ──────────────────────────────────────────────────────────────

export function getActiveVentureSlugClient(): string {
  if (typeof document === 'undefined') return 'novizio'
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : 'novizio'
}

export function setActiveVentureSlugClient(slug: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(slug)}; path=/; max-age=31536000; SameSite=Lax`
}

// ─── Venture config from env vars ─────────────────────────────────────────────

export function getVentureConfig(slug: string): VentureConfig {
  if (slug === 'hourbour') {
    return {
      id: 'hourbour',
      name: 'Hourbour',
      slug: 'hourbour',
      color: '#3B82F6',
      igHandle:      process.env.HOURBOUR_IG_HANDLE ?? '',
      ytChannelId:   process.env.HOURBOUR_YT_CHANNEL_ID ?? '',
      liProfileUrl:  process.env.HOURBOUR_LI_PROFILE_URL ?? '',
      ga4PropertyId: process.env.HOURBOUR_GA4_PROPERTY_ID ?? '',
    }
  }

  // Default: novizio
  return {
    id: 'novizio',
    name: 'Novizio',
    slug: 'novizio',
    color: '#E94560',
    igHandle:      process.env.NOVIZIO_IG_HANDLE ?? '',
    ytChannelId:   process.env.NOVIZIO_YT_CHANNEL_ID ?? '',
    liProfileUrl:  process.env.NOVIZIO_LI_PROFILE_URL ?? '',
    ga4PropertyId: process.env.NOVIZIO_GA4_PROPERTY_ID ?? '',
  }
}

export const VENTURES: { slug: string; name: string; color: string }[] = [
  { slug: 'novizio',  name: 'Novizio',  color: '#E94560' },
  { slug: 'hourbour', name: 'Hourbour', color: '#3B82F6' },
]
