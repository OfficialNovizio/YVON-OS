// Big Idea — read/write brand_big_idea JSONB on the ventures table

import 'server-only'
import { supabase } from '@/lib/supabase'
import type { BrandBigIdea } from '@/lib/types'

// Re-export so API route can import from one place

export async function getBigIdea(ventureId: string): Promise<BrandBigIdea | null> {
  const { data } = await supabase
    .from('ventures')
    .select('brand_big_idea')
    .eq('id', ventureId)
    .single()

  if (!data?.brand_big_idea) return null

  const raw = data.brand_big_idea as Record<string, unknown>
  return {
    brandNameMeaning:    (raw.brand_name_meaning    as string) ?? '',
    idealPerson:         (raw.ideal_person           as string) ?? '',
    idealPersonTraits:   (raw.ideal_person_traits    as string) ?? '',
    gatheringActivity:   (raw.gathering_activity     as string) ?? '',
    missionBeyondProduct:(raw.mission_beyond_product as string) ?? '',
    platformFocus:       (raw.platform_focus as BrandBigIdea['platformFocus']) ?? 'instagram',
  }
}

export async function saveBigIdea(ventureId: string, idea: BrandBigIdea): Promise<void> {
  await supabase
    .from('ventures')
    .update({
      brand_big_idea: {
        brand_name_meaning:    idea.brandNameMeaning,
        ideal_person:          idea.idealPerson,
        ideal_person_traits:   idea.idealPersonTraits,
        gathering_activity:    idea.gatheringActivity,
        mission_beyond_product:idea.missionBeyondProduct,
        platform_focus:        idea.platformFocus ?? 'instagram',
      },
    })
    .eq('id', ventureId)
}
