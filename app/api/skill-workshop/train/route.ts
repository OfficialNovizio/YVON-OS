// POST /api/skill-workshop/train
// Runs a real training iteration: sends prompt to DeepSeek, evaluates output
// against expected quality, saves result to Supabase training_runs table.
//
// Two LLM calls per iteration:
//   1. Generate: DeepSeek produces output from the prompt
//   2. Evaluate: DeepSeek judges the output against expected quality → score 0-100

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainRequest {
  workshopId: string
  agentName: string
  prompt: string
  expectedQuality: string
}

interface TrainResponse {
  output: string
  score: number
  passed: boolean
  areasImproved: string[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error('DEEPSEEK_API_KEY not configured')

  // Use the Anthropic-compatible endpoint (deepseek supports it)
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No output generated'
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    const body: TrainRequest = await request.json()
    const { workshopId, agentName, prompt, expectedQuality } = body

    if (!workshopId || !agentName || !prompt) {
      return NextResponse.json({ error: 'workshopId, agentName, and prompt are required' }, { status: 400 })
    }

    if (!DEEPSEEK_KEY) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured on server' }, { status: 500 })
    }

    // ── Phase 1: Generate ──────────────────────────────────────────────────
    const generateSystem = `You are ${agentName}, an AI agent in the YVON operating system.
You are in the Skill Workshop training environment. Produce the best possible output
for the given prompt. Be thorough, professional, and follow any brand/tone guidelines implied.`

    const output = await callDeepSeek(generateSystem, prompt)

    // ── Phase 2: Evaluate ──────────────────────────────────────────────────
    const evalSystem = `You are an AI quality evaluator for the YVON Skill Workshop.
Your job: score the output against the expected quality description.
Return ONLY a JSON object with this exact structure:
{
  "score": number (0-100),
  "areas_improved": string[] (2-4 specific areas where the output excelled),
  "feedback": string (one sentence summary)
}
Score guidelines:
- 90-100: Exceptional — exceeds expectations, creative, flawless
- 80-89: Good — meets all expectations, minor improvements possible
- 65-79: Adequate — mostly meets expectations, notable gaps
- 40-64: Needs work — significant gaps, incomplete
- 0-39: Poor — misses the mark entirely`

    const evalPrompt = `EXPECTED QUALITY:\n${expectedQuality || 'General professional quality expected'}

OUTPUT TO EVALUATE:
${output.slice(0, 2000)}

Evaluate the output against the expected quality. Return JSON only.`

    const evalRaw = await callDeepSeek(evalSystem, evalPrompt)

    // Parse evaluation JSON
    let score = 70, areasImproved: string[] = []
    try {
      // Extract JSON from the response (may have markdown fences)
      const jsonMatch = evalRaw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const evalData = JSON.parse(jsonMatch[0])
        score = Math.min(100, Math.max(0, Number(evalData.score) || 70))
        areasImproved = Array.isArray(evalData.areas_improved) ? evalData.areas_improved : []
      }
    } catch {
      score = evalRaw.toLowerCase().includes('exception') ? 90 :
              evalRaw.toLowerCase().includes('good') ? 82 :
              evalRaw.toLowerCase().includes('adequate') ? 72 : 65
      areasImproved = ['Output generated', 'Quality evaluated']
    }

    const passed = score >= 80

    // ── Phase 3: Save to Supabase ───────────────────────────────────────────
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
      await supabase.from('training_runs').insert({
        workshop_id: workshopId,
        agent_name: agentName,
        agent_dept: 'Workshop',
        prompt,
        expected_quality: expectedQuality || null,
        output,
        score,
        passed,
        areas_improved: areasImproved,
        model_used: 'deepseek-chat',
      })
    } catch {}

    const resp: TrainResponse = { output, score, passed, areasImproved }
    return NextResponse.json(resp)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Training failed' }, { status: 500 })
  }
}
