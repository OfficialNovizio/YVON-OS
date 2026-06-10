// Creative Studio Orchestration — multi-step AI content pipeline
// Agents: Atlas (mood/prompts), Lena+Kahneman (script/captions), Pixel (refine)
// POST: action-based dispatcher for each step in the 6-step flow

import { cookies } from 'next/headers'
import { callFast, callSynthesis } from '@/lib/ai-client'
import { getClothingItems } from '@/lib/clothing'
import { supabase } from '@/lib/supabase'
import { getVentureFromDB } from '@/lib/venture-server'
import type { ClothingItem, VentureConfig } from '@/lib/types'

export const maxDuration = 60

interface BriefData {
  campaignName: string
  objective: string
  audience: string
  tone: string
  platform: string
  contentType: string   // e.g. Reel | Post | Carousel | Story | Video | Short …
}

interface PromptShape {
  title: string
  text: string
  version: string
}

interface SceneShape {
  sceneNumber: number
  title: string
  description: string
  durationSeconds: number
}

type RequestBody = {
  action: string
  brief?: BriefData
  selectedMood?: string
  script?: string
  promptToRefine?: PromptShape
  feedback?: string
  pitchContext?: string
  scenes?: SceneShape[]
}

// Extract JSON from LLM output that may have markdown code fences
function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return raw
}

// Build rich venture context for injection into agent prompts
function buildVentureContext(v: VentureConfig): string {
  const lines: string[] = []
  lines.push(`VENTURE: ${v.name} (${v.slug})`)
  if (v.tagline) lines.push(`Tagline: ${v.tagline}`)
  if (v.description) lines.push(`Description: ${v.description}`)
  if (v.brandType) lines.push(`Brand Type: ${v.brandType}`)
  if (v.brandTier) lines.push(`Brand Tier: ${v.brandTier}`)
  if (v.avgPricePoint) lines.push(`Avg Price Point: $${v.avgPricePoint}`)
  if (v.brandBigIdea) {
    const bi = v.brandBigIdea
    if (bi.brandNameMeaning) lines.push(`Brand Meaning: ${bi.brandNameMeaning}`)
    if (bi.idealPerson) lines.push(`Ideal Person: ${bi.idealPerson} (${bi.idealPersonTraits ?? ''})`)
    if (bi.missionBeyondProduct) lines.push(`Mission: ${bi.missionBeyondProduct}`)
    if (bi.platformFocus) lines.push(`Platform Focus: ${bi.platformFocus}`)
  }
  if (v.targetAudience) {
    const ta = v.targetAudience
    const parts: string[] = []
    if (ta.ageRange) parts.push(`Age: ${ta.ageRange}`)
    if (ta.gender) parts.push(`Gender: ${ta.gender}`)
    if (ta.incomeTier) parts.push(`Income: ${ta.incomeTier}`)
    if (ta.region) parts.push(`Region: ${ta.region}`)
    if (ta.description) parts.push(`Description: ${ta.description}`)
    if (parts.length) lines.push(`Target Audience: ${parts.join(' | ')}`)
  }
  if (v.operatingCountries?.length) lines.push(`Operating Countries: ${v.operatingCountries.join(', ')}`)
  if (v.marketSubcategories?.length) lines.push(`Market: ${v.marketSubcategories.join(' > ')}`)
  return lines.join('\n')
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

  // Fetch real venture profile for agent context
  let ventureContext = `VENTURE: ${ventureId}`
  try {
    const venture = await getVentureFromDB(ventureId)
    ventureContext = buildVentureContext(venture)
  } catch {
    // If DB fails, agents still get the slug — better than nothing
  }

  let body: RequestBody
  try {
    body = await request.json() as RequestBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.action) return Response.json({ error: 'Missing action' }, { status: 400 })
  const { brief } = body

  try {
    switch (body.action) {

      // ── STEP 1: Mood Board Directions (Atlas + Kahneman L1) ──────────────────
      case 'generate-mood': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const prompt = `You are Atlas, Art Director at YVON.

${ventureContext}

Campaign Brief:
- Name: ${brief.campaignName}
- Objective: ${brief.objective}
- Audience: ${brief.audience}
- Tone: ${brief.tone}
- Platform: ${brief.platform}
- Format: ${brief.contentType || 'Post'}

Generate 3 distinct visual mood board directions for this campaign. Each is a complete visual world.

For each direction apply Kahneman L1 (Perception & First Impressions):
- What does someone FEEL in the first 2 seconds? (before logic fires)
- Which halo effect signal makes everything else feel premium?
- Is there a Von Restorff pattern interrupt — does this stand out in the category?

Return ONLY valid JSON with no markdown:
{
  "directions": [
    {
      "name": "evocative 2-word direction name",
      "concept": "one-line visual concept",
      "aesthetic": "2-3 sentences: the look, feel, texture, and atmosphere of this visual world",
      "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
      "references": ["cinematographic or brand visual reference 1", "reference 2"],
      "psychologyNote": "which specific L1 principle this activates and exactly why it works for this audience",
      "system1Effect": "what this makes the viewer feel in 2 seconds — be precise and visceral"
    }
  ]
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 2500 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── STEP 2: Content Script (Lena + Kahneman L1/L2/L6) ───────────────────
      case 'generate-script': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const prompt = `You are Lena (Brand Copywriter) working with the Kahneman Consumer Psychology framework.

Campaign: ${brief.campaignName}
Objective: ${brief.objective}
Audience: ${brief.audience}
Tone: ${brief.tone}
Platform: ${brief.platform} | Format: ${brief.contentType || 'Post'}
Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}

Format rules: ${
  brief.contentType === 'Reel' || brief.contentType === 'Video' || brief.contentType === 'Short'
    ? 'Write a hook-first script for vertical video. Hook in first 2 seconds. Voiceover or on-screen text. Under 90 words.'
    : brief.contentType === 'Carousel'
    ? 'Write a slide-by-slide script. Slide 1 = hook, slides 2–7 = value, slide 8 = CTA. Each slide max 15 words.'
    : brief.contentType === 'Story'
    ? 'Write a 3-frame story sequence. Frame 1 = pattern interrupt, Frame 2 = reveal, Frame 3 = CTA with sticker/swipe-up intent.'
    : brief.contentType === 'Article' || brief.contentType === 'Document'
    ? 'Write a LinkedIn-native opening hook + 3 key points + closing CTA. Professional tone, no hashtags in script.'
    : 'Write platform-native copy optimised for the feed.'
}

STEP 0B — SYSTEM 1 / SYSTEM 2 ROUTER:
Determine the primary system target. ${brief.platform} discovery content is almost always System 1.
State your route before proceeding.

Apply exactly these psychology layers:
- L1 (Perception & First Impressions): what does the viewer feel in the first 2 seconds?
- L2 (Desire Architecture): who does the viewer BECOME by engaging with this? (not the product — the person)
- L6 (Attention/Spread): why would someone share this? Name the exact mechanism (curiosity gap / Zeigarnik / emotional contagion / pattern interrupt).

Write a ${brief.platform}-native content hook/script under 150 words.

Return ONLY valid JSON with no markdown:
{
  "systemRoute": "System 1",
  "systemRationale": "one sentence why",
  "script": "the actual script content native to ${brief.platform}",
  "psychologyBreakdown": {
    "L1_firstImpression": "exactly what emotional trigger fires in 2 seconds",
    "L2_desireHook": "the specific identity promise — who does the viewer become",
    "L6_spreadMechanic": "the named mechanism + why this specific audience shares it"
  },
  "primaryLever": "e.g. L2 — Aspirational Self Gap"
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 2000 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── STEP 3: Captions A/B (Lena + Kahneman Lean Protocol) ────────────────
      case 'generate-captions': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const prompt = `You are Lena (Brand Copywriter) running the Kahneman Consumer Psychology LEAN Protocol.

${ventureContext}

Campaign: ${brief.campaignName}
Platform: ${brief.platform} | Format: ${brief.contentType || 'Post'}
Audience: ${brief.audience}
Tone: ${brief.tone}
Script context: ${body.script ?? 'Not provided'}

STEP 1 — PRE-CONTENT CHECKLIST:
Brand: venture context loaded above | Surface: ${brief.platform} post | Goal: ${brief.objective} | Stage: growing

STEP 4 — GENERATE A/B VARIANTS:
Each variant must test a GENUINELY DIFFERENT psychological lever — not tonal rewrites of the same mechanism.
Name levers explicitly: "L[N] — Layer Name — Specific Principle"
System 1 Score = how well it passes the 2-second scroll-stop test (1–5).

STEP 5 — OUTPUT AUDIT: Check System 1 filter + lever intentionality + brand consistency before returning.

Return ONLY valid JSON with no markdown:
{
  "variantA": {
    "caption": "full caption text with line breaks where natural, hashtags if appropriate",
    "lever": "L2 — Desire Architecture — Aspirational Self Gap",
    "rationale": "one sentence why this lever for this brand at growing stage",
    "system1Score": "4"
  },
  "variantB": {
    "caption": "full caption — a genuinely different psychological bet from A",
    "lever": "L6 — Attention — Curiosity Gap",
    "rationale": "one sentence on what different hypothesis this tests vs A",
    "system1Score": "4"
  },
  "runRecommendation": "Run A first because [specific reason tied to brand stage and lever logic]",
  "tripleCapStatus": "No cap issues — both levers fresh for this venture"
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 2500 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── STEP 4: AI Image Prompts (Atlas + Pixel + Kahneman L1/L2) ───────────
      case 'generate-prompts': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const prompt = `You are Atlas (Art Director) + Pixel (Production Pipeline) at YVON generating Midjourney/DALL-E 3 quality AI image prompts.

Campaign: ${brief.campaignName}
Objective: ${brief.objective}
Audience: ${brief.audience}
Tone: ${brief.tone}
Platform: ${brief.platform} | Format: ${brief.contentType || 'Post'}
Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}
Script: ${body.script ?? 'Not provided'}

Composition constraint: ${
  brief.contentType === 'Reel' || brief.contentType === 'Video' || brief.contentType === 'Short' || brief.contentType === 'Story'
    ? 'VERTICAL 9:16 frame. Subject centred vertically. Key visual in top third. Leave bottom third for caption overlay. No horizontal compositions.'
    : brief.contentType === 'Carousel'
    ? '4:5 portrait frame. Each prompt = one carousel slide. Must read as standalone AND as part of a sequence.'
    : brief.contentType === 'Article' || brief.contentType === 'Thumbnail'
    ? 'HORIZONTAL 16:9 frame. Cinematic widescreen composition. Rule-of-thirds subject placement.'
    : 'SQUARE 1:1 frame. Centred or rule-of-thirds. Strong focal point that reads at thumbnail scale.'
}

PSYCHOLOGY INTEGRATION (non-negotiable):

Kahneman L1 — Perception & First Impressions:
- Every prompt must answer: what does someone FEEL in the first 2 seconds?
- Halo effect: one dominant premium visual signal (light, material, composition) elevates everything else
- Thin-slicing: image communicates brand identity in <100ms
- Pattern interrupt: break the expected visual format for this category

Kahneman L2 — Desire Architecture:
- Image shows who the viewer BECOMES — not what the product is
- The aspirational gap is the visual story: current self → desired self

TECHNICAL STANDARD (Atlas/Pixel level):
Every prompt must specify: shot type + subject description + lighting setup + background + color grading style + camera model + lens + post-processing style + resolution + mood keywords.
Aim for Denis Villeneuve cinematography meets high-fashion editorial.
Minimum 80 words per prompt.

Generate 4 DISTINCT image prompts — different shots, angles, moods, and psychological activations.

Return ONLY valid JSON with no markdown:
{
  "psychologyBrief": "one sentence on the unified psychological intent — what all 4 images make the viewer want to become",
  "prompts": [
    {
      "title": "evocative 2-3 word concept name",
      "version": "V1.0",
      "text": "Complete prompt: [shot type]. [subject]. [lighting]. [background]. [color palette/grading]. [camera + lens]. [post-processing]. [resolution]. [mood keywords]. Minimum 80 words.",
      "psychologyLayer": "L1 + L2 — Specific principles (e.g. Halo Effect + Aspirational Identity Gap)",
      "systemOneEffect": "what this image makes the viewer feel or desire in 2 seconds — be visceral and specific"
    }
  ]
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 3500 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── STORYLINE: Multi-scene video blueprint (Atlas + Lena + Kahneman) ───────
      case 'generate-storyline': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const prompt = `You are Atlas (Art Director) + Lena (Brand Copywriter) at YVON, creating a VIDEO STORYLINE.

${ventureContext}

Campaign Brief:
- Name: ${brief.campaignName}
- Objective: ${brief.objective}
- Audience: ${brief.audience}
- Tone: ${brief.tone}
- Platform: ${brief.platform}
- Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}

Create a complete ${brief.platform}-native VIDEO STORYLINE with 3–5 scenes. Total duration must fit the platform.

For each scene, apply:
- Kahneman L1 (Perception): what is the FIRST THING the eye lands on? Is the no-sound story clear?
- Kahneman L2 (Desire): what identity/aspiration does this scene build toward?
- Atlas visual standard: shot type + lighting + composition must be cinema-grade

For each scene generate TWO prompts:
1. IMAGE PROMPT (Midjourney/DALL-E 3 quality): shot type, subject, lighting, background, color grading, camera, lens, post-processing. Minimum 60 words.
2. MOTION PROMPT (for Runway/Kling/Sora): camera movement (dolly/pan/push/pull), pacing, transition in/out, subject motion, atmosphere. Minimum 30 words.

NO-SOUND TEST: Each scene must visually tell its part of the story without audio. State what the viewer understands.

Platform duration rules:
- Instagram Reel: max 90s recommended (ideal 30–45s)
- TikTok: max 60s recommended (ideal 15–30s)
- YouTube Short: max 60s
- LinkedIn: max 60s

Return ONLY valid JSON with no markdown:
{
  "storylineTitle": "evocative title for this video concept",
  "totalDuration": 30,
  "hook": "one-sentence opening hook — what grabs attention in the first 2 seconds",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "scene name",
      "description": "what happens in this scene — action, mood, narrative purpose",
      "durationSeconds": 5,
      "imagePrompt": "complete still-image reference prompt — minimum 60 words, cinema-grade technical specs",
      "motionPrompt": "camera movement + subject motion + transition in/out + pacing — minimum 30 words",
      "noSoundTest": "what the viewer understands from this scene with no audio — be specific",
      "voiceoverText": "optional on-screen text or VO line — or empty string if purely visual"
    }
  ],
  "platformFit": {
    "instagram_reel": { "maxDuration": 90, "fits": true, "recommendation": "one sentence" },
    "tiktok": { "maxDuration": 60, "fits": true, "recommendation": "one sentence" },
    "youtube_short": { "maxDuration": 60, "fits": true, "recommendation": "one sentence" }
  },
  "noSoundSummary": "overall assessment: can the full story be understood without audio? Rate 1–5 and explain",
  "editingNotes": "pacing and cut notes for the editor — transitions, music cues, timing"
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 4000 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── REFINE: Improve a single prompt with feedback (Pixel) ────────────────
      case 'refine-prompt': {
        const { promptToRefine, feedback } = body
        if (!promptToRefine) return Response.json({ error: 'Missing promptToRefine' }, { status: 400 })

        const currentVer = parseFloat(promptToRefine.version?.replace('V', '') ?? '1.0')
        const newVer = `V${(currentVer + 0.1).toFixed(1)}`

        const prompt = `You are Pixel (Production Pipeline Engineer) at YVON. Refine this AI image prompt based on specific feedback.

ORIGINAL PROMPT:
Title: ${promptToRefine.title}
Text: ${promptToRefine.text}

USER FEEDBACK: "${feedback ?? 'Make it more cinematic and premium'}"

Campaign: ${brief?.campaignName ?? ''} | Audience: ${brief?.audience ?? ''} | Tone: ${brief?.tone ?? 'Premium'}

Rules:
- Keep the same visual concept and title — only refine the execution
- Incorporate the feedback precisely
- Reinforce Kahneman L1 (Perception): strengthen the first-impression signal
- Maintain all technical specs (shot type, lens, resolution)
- Result must be at least 80 words

Return ONLY valid JSON with no markdown:
{
  "title": "${promptToRefine.title}",
  "version": "${newVer}",
  "text": "refined prompt incorporating feedback — technically complete, minimum 80 words",
  "changes": "one sentence on what changed and the psychological reason why it improves the prompt"
}`

        const raw = await callFast({ messages: [{ role: 'user', content: prompt }], maxTokens: 1200 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      // ── OUTFIT BUILDER: AI outfit assignments per scene (Atlas + Pixel) ───────
      case 'generate-outfits': {
        if (!body.scenes || body.scenes.length === 0) {
          return Response.json({ error: 'Missing scenes' }, { status: 400 })
        }

        const { data: vRow } = await supabase.from('ventures').select('id').eq('slug', ventureId).single()
        const resolvedId = (vRow?.id as string | undefined) ?? ventureId
        const items = await getClothingItems(resolvedId)

        if (items.length === 0) {
          return Response.json({ error: 'No clothing items found for this venture' }, { status: 404 })
        }

        const byCategory = (cat: ClothingItem['category']) =>
          items.filter(i => i.category === cat).map(i => `• ${i.name} (${i.color}) — ${i.description}`).join('\n')

        const catalogue = `
TOPS:
${byCategory('top') || 'None'}

BOTTOMS:
${byCategory('bottom') || 'None'}

OUTERWEAR:
${byCategory('outerwear') || 'None'}

FOOTWEAR:
${byCategory('footwear') || 'None'}

ACCESSORIES:
${byCategory('accessory') || 'None'}
`.trim()

        const sceneSummary = body.scenes.map(s =>
          `Scene ${s.sceneNumber}: "${s.title}" — ${s.description} (${s.durationSeconds}s)`
        ).join('\n')

        const prompt = `You are Atlas (Art Director) at YVON. Assign outfits from the active clothing line to each video scene.

Campaign: ${brief?.campaignName ?? 'Untitled'} | Platform: ${brief?.platform ?? 'Instagram'} | Tone: ${brief?.tone ?? 'Premium'}

VIDEO SCENES:
${sceneSummary}

ACTIVE CLOTHING LINE:
${catalogue}

Rules:
- Use ONLY items from the catalogue above — exact names
- Each scene gets: top + bottom + (outerwear if scene mood calls for it) + footwear + accessory
- Outerwear is optional — omit if it would look overdressed for the scene
- Styling note per item: HOW to wear it (tucked/untucked, layered, rolled, etc.)
- stylingNotes: the overall look direction for the scene — one sentence
- heroItem: the single garment that carries the scene (most visually dominant)

Return ONLY valid JSON with no markdown:
{
  "outfits": [
    {
      "sceneNumber": 1,
      "top":       { "name": "exact name from catalogue", "color": "color", "styling": "how to wear it" },
      "bottom":    { "name": "exact name from catalogue", "color": "color", "styling": "how to wear it" },
      "outerwear": { "name": "exact name from catalogue", "color": "color", "styling": "how to wear it" },
      "footwear":  { "name": "exact name from catalogue", "color": "color", "styling": "how to wear it" },
      "accessory": { "name": "exact name from catalogue", "color": "color", "styling": "how to wear it" },
      "stylingNotes": "overall direction — one sentence",
      "heroItem": "item name"
    }
  ]
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 3000 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json({ ...data, catalogue: items })
      }

      // ── SHOOT MODE: Real-product phone shoot brief (Atlas + Pixel) ────────
      case 'generate-shot-list': {
        if (!brief) return Response.json({ error: 'Missing brief' }, { status: 400 })

        const compositionRule =
          brief.contentType === 'Reel' || brief.contentType === 'Video' || brief.contentType === 'Short' || brief.contentType === 'Story'
            ? 'VERTICAL 9:16 — hold phone portrait. Subject in upper two-thirds. Leave room at bottom for caption overlay.'
            : brief.contentType === 'Carousel'
            ? '4:5 portrait — hold phone portrait. Each shot = one carousel slide. Keep background consistent across all 5 shots.'
            : brief.contentType === 'Article' || brief.contentType === 'Thumbnail'
            ? 'HORIZONTAL 16:9 — hold phone landscape. Rule-of-thirds subject placement. Strong focal element left or right.'
            : 'SQUARE 1:1 — hold phone portrait then crop square in-app. Strong centred focal point that reads at thumbnail scale.'

        const prompt = `You are Atlas (Art Director) + Pixel (Production Pipeline) at YVON creating a phone-shoot brief.

${ventureContext}

Campaign:
- Name: ${brief.campaignName}
- Objective: ${brief.objective}
- Audience: ${brief.audience}
- Tone: ${brief.tone}
- Platform: ${brief.platform} | Format: ${brief.contentType || 'Post'}
- Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}

Generate a 5-shot brief for PHONE PHOTOGRAPHY — no studio gear, no professional equipment.
This is designed for a founder or team member shooting alone or with one helper.

Composition: ${compositionRule}

Each shot must give actionable, specific direction:
- FRAMING: exact angle, distance, what fills the frame, what is cut off intentionally
- LIGHTING: which window to face, what time of day, whether to diffuse with a thin curtain, avoid direct harsh sun
- DIRECTION: exact body/product position, whether subject moves, gaze direction, what to do with hands
- PACING: for video — how long the shot runs, camera movement (static / slow pan / handheld drift). For photo — single tap-to-focus or burst mode.
- TIP: one specific phone photography trick for this exact shot (e.g. "tap and hold to lock focus then slide down to reduce exposure")

Return ONLY valid JSON with no markdown:
{
  "briefTitle": "evocative 2-3 word shoot concept",
  "postingNote": "one sentence on best time + context to post this on ${brief.platform}",
  "captionDraft": "a ready-to-post caption for this shoot — conversational, brand-native, with hashtags at the end",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"],
  "shots": [
    {
      "shotNumber": 1,
      "title": "2-3 word shot name",
      "framing": "exact framing instruction — what is centred, what angle, how far away, portrait or landscape hold",
      "lighting": "precise natural light instruction — window position, time of day, direct vs diffused, what to avoid",
      "direction": "exact subject direction — body position, movement, gaze, expression, hands, energy level",
      "durationOrPacing": "video: duration in seconds + camera movement. photo: burst or single, any specific timing.",
      "tip": "one tactical phone photography tip specific to this exact shot"
    }
  ]
}`

        const raw = await callSynthesis({ messages: [{ role: 'user', content: prompt }], maxTokens: 3000 })
        const data = JSON.parse(extractJson(raw)) as Record<string, unknown>
        return Response.json(data)
      }

      default:
        return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
