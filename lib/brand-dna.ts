// Brand DNA Engine — learns brand voice from winning content
// All campaigns are generated inside this voice profile

import 'server-only'
import { supabase } from '@/lib/supabase'

export interface BrandVoiceProfile {
  ventureId: string
  toneWords: string[]
  sentenceStructure: 'short' | 'medium' | 'long' | 'mixed'
  vocabulary: string[]
  bannedWords: string[]
  emojiUsage: 'none' | 'minimal' | 'moderate' | 'heavy'
  ctaStyle: 'direct' | 'soft' | 'question'
  brandArchetype: string
  consistencyScore: number
}

export async function getBrandDNA(ventureId: string): Promise<BrandVoiceProfile | null> {
  const { data } = await supabase
    .from('brand_dna')
    .select('*')
    .eq('venture_id', ventureId)
    .single()

  if (!data) return null

  const profile = data.voice_profile as Record<string, unknown> ?? {}
  return {
    ventureId: data.venture_id,
    toneWords: (profile.tone_words as string[]) ?? [],
    sentenceStructure: (profile.sentence_structure as BrandVoiceProfile['sentenceStructure']) ?? 'mixed',
    vocabulary: (profile.vocabulary as string[]) ?? [],
    bannedWords: (profile.banned_words as string[]) ?? [],
    emojiUsage: (profile.emoji_usage as BrandVoiceProfile['emojiUsage']) ?? 'minimal',
    ctaStyle: (profile.cta_style as BrandVoiceProfile['ctaStyle']) ?? 'direct',
    brandArchetype: (profile.brand_archetype as string) ?? '',
    consistencyScore: parseFloat(data.consistency_score as string ?? '0'),
  }
}

export async function saveBrandDNA(profile: BrandVoiceProfile): Promise<void> {
  await supabase.from('brand_dna').upsert({
    venture_id: profile.ventureId,
    voice_profile: {
      tone_words: profile.toneWords,
      sentence_structure: profile.sentenceStructure,
      vocabulary: profile.vocabulary,
      banned_words: profile.bannedWords,
      emoji_usage: profile.emojiUsage,
      cta_style: profile.ctaStyle,
      brand_archetype: profile.brandArchetype,
    },
    consistency_score: profile.consistencyScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'venture_id' })
}
