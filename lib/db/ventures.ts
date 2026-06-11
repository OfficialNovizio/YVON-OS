import 'server-only'
import { supabase } from '@/lib/supabase'
import type {
  VentureConfig,
  VentureSocial,
} from '@/lib/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

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
    deploymentPlatforms: (r.deployment_platforms as string[]) ?? undefined,
    deploymentConfig:    (r.deployment_config as Record<string, Record<string, string>>) ?? undefined,
  }
}

// ─── Ventures ─────────────────────────────────────────────────────────────────

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
  if (data.deploymentPlatforms  !== undefined) update.deployment_platforms = data.deploymentPlatforms
  if (data.deploymentConfig     !== undefined) update.deployment_config    = data.deploymentConfig
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
