// Creative Studio Orchestration — multi-step AI content pipeline
// Agents: Atlas (mood/prompts), Lena+Kahneman (script/captions), Pixel (refine)
// POST: action-based dispatcher for each step in the 6-step flow

import { cookies } from 'next/headers'
import { callFast, callSynthesis } from '@/lib/ai-client'

export const maxDuration = 60

interface BriefData {
  campaignName: string
  objective: string
  audience: string
  tone: string
  platform: string
}

interface PromptShape {
  title: string
  text: string
  version: string
}

type RequestBody = {
  action: string
  brief?: BriefData
  selectedMood?: string
  script?: string
  promptToRefine?: PromptShape
  feedback?: string
}

// Extract JSON from LLM output that may have markdown code fences
function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()
  const objMatch = raw.match(/\{[\s\S]*\}/)
  if (objMatch) return objMatch[0]
  return raw
}

export async function POST(request: Request): Promise<Response> {
  const cookieStore = await cookies()
  const ventureId = cookieStore.get('yvon_active_venture')?.value ?? 'novizio'

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

        const prompt = `You are Atlas, Art Director at YVON (${ventureId}).

Campaign Brief:
- Name: ${brief.campaignName}
- Objective: ${brief.objective}
- Audience: ${brief.audience}
- Tone: ${brief.tone}
- Platform: ${brief.platform}

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
Platform: ${brief.platform}
Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}

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

Campaign: ${brief.campaignName}
Platform: ${brief.platform}
Audience: ${brief.audience}
Tone: ${brief.tone}
Script context: ${body.script ?? 'Not provided'}

STEP 1 — PRE-CONTENT CHECKLIST:
Brand: ${ventureId} | Surface: ${brief.platform} post | Goal: ${brief.objective} | Stage: growing

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
  "tripleCapStatus": "No cap issues — both levers fresh for ${ventureId}"
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
Visual direction: ${body.selectedMood ?? 'Premium, cinematic'}
Script: ${body.script ?? 'Not provided'}

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

      default:
        return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 502 })
  }
}
