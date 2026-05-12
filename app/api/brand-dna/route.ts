// Brand DNA Engine — learn voice profile and generate on-brand content
// GET: returns current brand DNA profile
// POST: analyzes top content to learn/update brand voice

import { cookies } from 'next/headers'
import { callSynthesis } from '@/lib/ai-client'
import { getBrandDNA, saveBrandDNA } from '@/lib/brand-dna'
import { getTopContent } from '@/lib/db-phase1'

export async function GET(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const dna = await getBrandDNA(ventureId)
  return Response.json({ ventureId, brandDNA: dna })
}

export async function POST(): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  const topContent = await getTopContent(ventureId, 15)
  if (topContent.length < 3) {
    return Response.json({ error: 'Need at least 3 content items to learn brand voice' }, { status: 400 })
  }

  const captions = topContent.map((c) => c.captionPreview).filter(Boolean)

  const prompt = `You are a brand voice analyzer. Analyze these ${captions.length} top-performing content pieces and extract the brand's DNA voice profile:

CAPTIONS:
${captions.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return the brand voice profile as ONLY valid JSON:
{
  "toneWords": ["word1", "word2", ...],
  "sentenceStructure": "short/medium/long/mixed",
  "vocabulary": ["key terms", ...],
  "bannedWords": ["words to avoid", ...],
  "emojiUsage": "none/minimal/moderate/heavy",
  "ctaStyle": "direct/soft/question",
  "brandArchetype": "e.g. The Challenger, The Creator, The Sage"
}`

  try {
    const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 2000 })
    const profile = JSON.parse(raw) as Record<string, unknown>

    await saveBrandDNA({
      ventureId,
      toneWords: (profile.toneWords as string[]) ?? [],
      sentenceStructure: (profile.sentenceStructure as 'short' | 'medium' | 'long' | 'mixed') ?? 'mixed',
      vocabulary: (profile.vocabulary as string[]) ?? [],
      bannedWords: (profile.bannedWords as string[]) ?? [],
      emojiUsage: (profile.emojiUsage as 'none' | 'minimal' | 'moderate' | 'heavy') ?? 'minimal',
      ctaStyle: (profile.ctaStyle as 'direct' | 'soft' | 'question') ?? 'direct',
      brandArchetype: (profile.brandArchetype as string) ?? '',
      consistencyScore: 0,
    })

    return Response.json({ ventureId, brandDNA: profile, learnedFrom: topContent.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
