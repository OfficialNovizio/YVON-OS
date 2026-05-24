import { callFast, streamSynthesis } from '@/lib/ai-client'
import { getAgent } from '@/lib/agents'
import { getAgentMemory } from '@/lib/agent-memory'
import type { AgentId } from '@/lib/types'

export const maxDuration = 60

// Persona memory is now pulled live from Supabase via lib/agent-memory.
async function agentSystem(agentId: string): Promise<string> {
  const agent = getAgent(agentId as AgentId)
  const mem   = await getAgentMemory(agentId, undefined, 800)
  return [agent?.systemPrompt ?? '', mem].filter(Boolean).join('\n\n')
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ViralityScore {
  shareability:    number
  relatability:    number
  hook_strength:   number
  platform_native: number
  trend_fit:       number
  total:           number
}

interface ContentPitch {
  id:       string
  platform: string
  format:   string
  hook:     string
  angle:    string
  tactic:   string
  virality: ViralityScore
}

// ─── Virality scorer ───────────────────────────────────────────────────────────

async function scoreVirality(hook: string, angle: string, platform: string): Promise<ViralityScore> {
  try {
    const text = await callFast({
      maxTokens: 150,
      messages: [{
        role: 'user',
        content: `Score this content pitch for exponential social growth. Return ONLY valid JSON, no prose.
Hook: "${hook}"
Angle: "${angle}"
Platform: ${platform}
JSON: {"shareability":N,"relatability":N,"hook_strength":N,"platform_native":N,"trend_fit":N}
where N = 1-5 (5 = highest viral potential)`,
      }],
    })
    const match = text.match(/\{[\s\S]*?\}/)
    if (!match) return defScore()
    const p = JSON.parse(match[0]) as Record<string, number>
    const s = clamp(p.shareability), r = clamp(p.relatability),
          h = clamp(p.hook_strength), pn = clamp(p.platform_native), tf = clamp(p.trend_fit)
    return { shareability: s, relatability: r, hook_strength: h, platform_native: pn, trend_fit: tf, total: s+r+h+pn+tf }
  } catch { return defScore() }
}

function clamp(n: unknown): number {
  const v = Number(n)
  return isNaN(v) ? 3 : Math.min(5, Math.max(1, Math.round(v)))
}

function defScore(): ViralityScore {
  return { shareability: 3, relatability: 3, hook_strength: 3, platform_native: 3, trend_fit: 3, total: 15 }
}

// ─── Pitch parser ──────────────────────────────────────────────────────────────

function parsePitches(text: string): Omit<ContentPitch, 'id' | 'virality'>[] {
  const results: Omit<ContentPitch, 'id' | 'virality'>[] = []
  const blocks = text.split(/(?:^|\n)(?:PITCH\s*\d+|---+)\s*\n/i).filter(b => b.trim().length > 20)
  for (const block of blocks) {
    const platform = block.match(/Platform:\s*(.+)/i)?.[1]?.trim() ?? 'Instagram'
    const format   = block.match(/Format:\s*(.+)/i)?.[1]?.trim()   ?? 'Reel'
    const hook     = block.match(/Hook:\s*(.+)/i)?.[1]?.trim()     ?? ''
    const angle    = block.match(/Angle:\s*([\s\S]+?)(?=\nTactic:|\n---|\n\n|$)/i)?.[1]?.trim() ?? ''
    const tactic   = block.match(/Tactic:\s*(.+)/i)?.[1]?.trim()   ?? ''
    if (hook) results.push({ platform, format, hook, angle, tactic })
  }
  return results.slice(0, 5)
}

// ─── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const encoder = new TextEncoder()

  let body: { phase: string; venture: string; message?: string; context?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { phase, venture, message, context, agentId: explicitAgent, mode } = body as typeof body & { agentId?: string; mode?: '1h' | '6h' | '48h' }

  const stream = new ReadableStream({
    async start(controller) {

      function emit(type: string, data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
      }

      try {

        // ══════════════════════════════════════════════════════════════
        //  PHASE: AUTO-BRIEF — full sprint opening (Kai → Nate+Rio → Lena)
        // ══════════════════════════════════════════════════════════════

        if (phase === 'auto-brief') {

          const sprintMode = mode ?? '48h'

          // ══════════════════════════════════════════════════════════════
          //  1-HOUR MODE: Kai trend alert only → Lena 1 hook → score
          // ══════════════════════════════════════════════════════════════
          if (sprintMode === '1h') {
            emit('phase',       { phase: 'briefing', label: 'Kai scanning for right-now trends...' })
            emit('agent_start', { agentId: 'kai-analyst' })

            const kaiBrief = await callFast({
              system:    await agentSystem('kai-analyst'),
              maxTokens: 200,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. RAPID SPRINT — 1 hour window.

You are Kai. One trend is spiking RIGHT NOW. Give:

⚡ TREND ALERT
[Trend name]: [Why it's spiking TODAY, not this week. 1 sentence.]

🎯 HOOK SIGNAL
[The single angle Lena must attack. 1 sentence. Be ruthlessly specific.]`,
              }],
            })
            emit('agent_message', { agentId: 'kai-analyst', content: kaiBrief, messageType: 'brief' })

            emit('phase',       { phase: 'pitching', label: 'Lena writing rapid hook...' })
            emit('agent_start', { agentId: 'lena-brand' })

            const lenaRaw = await callFast({
              system:    await agentSystem('lena-brand'),
              maxTokens: 250,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. RAPID SPRINT — post within the hour.

Kai's signal: ${kaiBrief}

You are Lena. Write ONE hook. No production needed — this is raw, human, immediate. Use EXACTLY this format:

PITCH 1
Platform: [TikTok or Instagram — whichever is faster to post raw]
Format: [Raw video or Story — no editing needed]
Hook: [EXACT first line — post this word for word]
Angle: [1 sentence: why this will spread in the next 2 hours]
Tactic: [tactic name]`,
              }],
            })
            emit('agent_message', { agentId: 'lena-brand', content: lenaRaw, messageType: 'pitch' })

            const rawPitches = parsePitches(lenaRaw)
            const scored = await Promise.all(
              rawPitches.map(async (p) => {
                const virality = await scoreVirality(p.hook, p.angle, p.platform)
                return { ...p, id: crypto.randomUUID(), virality } as ContentPitch
              })
            )
            emit('pitches', { pitches: scored })
            emit('phase',   { phase: 'active', label: 'Rapid sprint active — approve and post now' })

          // ══════════════════════════════════════════════════════════════
          //  6-HOUR MODE: Kai brief → Nate top action → Lena 2 hooks
          // ══════════════════════════════════════════════════════════════
          } else if (sprintMode === '6h') {
            emit('phase',       { phase: 'briefing', label: 'Kai opening 6h sprint...' })
            emit('agent_start', { agentId: 'kai-analyst' })

            const kaiBrief = await callFast({
              system:    await agentSystem('kai-analyst'),
              maxTokens: 300,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. RAPID SPRINT — 6 hour window.

You are Kai. Be fast and decisive:

📊 SNAPSHOT
[2 metrics that changed in the last 24h. Numbers only.]

🔥 TREND NOW
[One trend spiking today. RISING or PEAK? One sentence on why.]

🎯 SIGNAL
[Single insight driving content for this 6h sprint. 1 sentence.]`,
              }],
            })
            emit('agent_message', { agentId: 'kai-analyst', content: kaiBrief, messageType: 'brief' })

            emit('phase',       { phase: 'explore', label: 'Nate picking the lever...' })
            emit('agent_start', { agentId: 'nate-growth' })

            const nateRead = await callFast({
              system:    await agentSystem('nate-growth'),
              maxTokens: 250,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. RAPID SPRINT — 6 hours.

Kai's signal: ${kaiBrief.slice(0, 300)}

You are Nate. One lever only:

⚡ THE MOVE
[Single highest-impact action to take RIGHT NOW. No options — just the one.]

🧪 FAST TEST
[One thing to A/B in this 6h window. Format: "Test [X] vs [Y] — winner by hour 6."]`,
              }],
            })
            emit('agent_message', { agentId: 'nate-growth', content: nateRead, messageType: 'analysis' })

            emit('phase',       { phase: 'pitching', label: 'Lena writing 2 hooks...' })
            emit('agent_start', { agentId: 'lena-brand' })

            const lenaRaw = await callFast({
              system:    await agentSystem('lena-brand'),
              maxTokens: 500,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. RAPID SPRINT — live within 6 hours.

Kai: ${kaiBrief.slice(0, 200)}
Nate: ${nateRead.slice(0, 200)}

You are Lena. Pitch 2 content pieces — producible in under 2 hours. Use EXACTLY this format:

PITCH 1
Platform: [platform]
Format: [format]
Hook: [exact hook]
Angle: [2 sentences]
Tactic: [tactic name]
---
PITCH 2
Platform: [platform]
Format: [format]
Hook: [exact hook]
Angle: [2 sentences]
Tactic: [tactic name]`,
              }],
            })
            emit('agent_message', { agentId: 'lena-brand', content: lenaRaw, messageType: 'pitch' })

            const rawPitches = parsePitches(lenaRaw)
            const scored = await Promise.all(
              rawPitches.map(async (p) => {
                const virality = await scoreVirality(p.hook, p.angle, p.platform)
                return { ...p, id: crypto.randomUUID(), virality } as ContentPitch
              })
            )
            scored.sort((a, b) => b.virality.total - a.virality.total)
            emit('pitches', { pitches: scored })
            emit('phase',   { phase: 'active', label: '6h sprint active — approve and produce now' })

          // ══════════════════════════════════════════════════════════════
          //  48-HOUR MODE: Full flow — Kai → Nate+Rio → Lena 4 pitches
          // ══════════════════════════════════════════════════════════════
          } else {
            emit('phase',       { phase: 'briefing', label: 'Kai opening sprint...' })
            emit('agent_start', { agentId: 'kai-analyst' })

            const kaiBrief = await callFast({
              system:    await agentSystem('kai-analyst'),
              maxTokens: 500,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}. You are Kai opening the Growth Sprint Room.

Deliver the sprint opening brief in this EXACT format (no deviation):

📊 ANALYTICS SNAPSHOT
[What changed this week — 2-3 specific metrics with numbers. Flag anything >15% up or down.]

🔥 TREND VELOCITY
- [Trend 1 name]: RISING — [one sentence why this matters now]
- [Trend 2 name]: RISING — [one sentence why]
- [Trend 3 name]: PEAK — [one sentence, avoid this one]

⚡ COMPETITOR MOVE
[One specific thing a rival fintech brand did this week that is getting traction. What makes it work?]

🎯 SPRINT SIGNAL
[The single data insight that should drive ALL content this sprint. 2 sentences max. Be decisive.]`,
              }],
            })
            emit('agent_message', { agentId: 'kai-analyst', content: kaiBrief, messageType: 'brief' })

            emit('phase', { phase: 'explore', label: 'Nate + Rio reading the data...' })

            const [nateRead, rioRead] = await Promise.all([
              (async () => {
                emit('agent_start', { agentId: 'nate-growth' })
                return callFast({
                  system:    await agentSystem('nate-growth'),
                  maxTokens: 400,
                  messages: [{
                    role: 'user',
                    content: `Venture: ${venture}.

Kai's brief: ${kaiBrief.slice(0, 500)}

You are Nate. Give your growth read:

🚀 FUNNEL READ
[Where is the funnel leaking right now — Download/Signup/Paid. Be specific about the stage and why.]

⚡ TOP 3 LEVERAGE ACTIONS
1. Quick Win (this week): [action — why it's high impact, low effort]
2. Big Bet (this sprint): [action — why it's worth the effort]
3. Kill: [what to stop doing immediately — be blunt]

🧪 EXPERIMENT PITCH
[One 14-day test. Format: "IF we [action] THEN [metric] will improve by [estimate] BECAUSE [reason]"]`,
                  }],
                })
              })(),
              (async () => {
                emit('agent_start', { agentId: 'rio-ads' })
                return callFast({
                  system:    await agentSystem('rio-ads'),
                  maxTokens: 400,
                  messages: [{
                    role: 'user',
                    content: `Venture: ${venture}.

Kai's brief: ${kaiBrief.slice(0, 500)}

You are Rio. Give your channel performance read:

📈 CHANNEL HEALTH vs BENCHMARKS
- Instagram (target: >2× followers in 48h): [status + specific gap]
- TikTok (target: >50% view retention): [status + specific gap]
- LinkedIn (target: >3% engagement): [status + specific gap]
- YouTube: [status + specific gap]

💰 DOUBLE DOWN
[The one channel that is underinvested relative to its performance. What's the specific next move?]

🔥 AMPLIFICATION ALERT
[Any post in the last 72h hitting >2× benchmark? If yes — recommend exact boost action + budget. If no — say "No amplification triggers this cycle."]`,
                  }],
                })
              })(),
            ])

            emit('agent_message', { agentId: 'nate-growth', content: nateRead, messageType: 'analysis' })
            emit('agent_message', { agentId: 'rio-ads',     content: rioRead,  messageType: 'analysis' })

            emit('phase',       { phase: 'pitching', label: 'Lena writing content pitches...' })
            emit('agent_start', { agentId: 'lena-brand' })

            const lenaRaw = await callFast({
              system:    await agentSystem('lena-brand'),
              maxTokens: 900,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}.

SPRINT CONTEXT:
Kai's brief: ${kaiBrief.slice(0, 350)}
Nate's read: ${nateRead.slice(0, 250)}
Rio's read: ${rioRead.slice(0, 250)}

You are Lena. Pitch 4 content pieces for this sprint. Every pitch must:
- Target a RISING trend only (never Peak or Declining)
- Pass the shareability test: "Would someone send this to a friend?"
- Have a hook that stops the scroll in 3 seconds
- Be producible within 48 hours

Use EXACTLY this format — no deviations, no extra text before or after:

PITCH 1
Platform: [Instagram/TikTok/LinkedIn/YouTube]
Format: [Reel/Carousel/Short/Thread/Post]
Hook: [EXACT first line — no placeholders, ready to post]
Angle: [2 sentences: what this content does + why it will spread]
Tactic: [Tactics Library play this executes, e.g. "Clarity Elevator"]
---
PITCH 2
Platform: [platform]
Format: [format]
Hook: [exact hook]
Angle: [2 sentences]
Tactic: [tactic name]
---
PITCH 3
Platform: [platform]
Format: [format]
Hook: [exact hook]
Angle: [2 sentences]
Tactic: [tactic name]
---
PITCH 4
Platform: [platform]
Format: [format]
Hook: [exact hook]
Angle: [2 sentences]
Tactic: [tactic name]`,
              }],
            })

            emit('agent_message', { agentId: 'lena-brand', content: lenaRaw, messageType: 'pitch' })

            const rawPitches = parsePitches(lenaRaw)
            const scored = await Promise.all(
              rawPitches.map(async (p) => {
                const virality = await scoreVirality(p.hook, p.angle, p.platform)
                return { ...p, id: crypto.randomUUID(), virality } as ContentPitch
              })
            )
            scored.sort((a, b) => b.virality.total - a.virality.total)
            emit('pitches', { pitches: scored })
            emit('phase',   { phase: 'active', label: 'Sprint active — approve, pass, or steer' })
          }

        // ══════════════════════════════════════════════════════════════
        //  PHASE: MESSAGE — Stark steers the sprint
        // ══════════════════════════════════════════════════════════════

        } else if (phase === 'message') {
          const msg   = message ?? ''
          const lower = msg.toLowerCase()

          let target = explicitAgent ?? 'lena-brand'
          if (!explicitAgent) {
            if (lower.match(/\b(data|metric|stat|trend|analytics|spike|drop|benchmark)\b/))     target = 'kai-analyst'
            else if (lower.match(/\b(funnel|growth|experiment|conversion|activation|trial)\b/)) target = 'nate-growth'
            else if (lower.match(/\b(channel|platform|boost|amplif|budget|spend|roas|cpm)\b/)) target = 'rio-ads'
            else if (lower.match(/\b(visual|design|art|aesthetic|colour|color|mood|image)\b/))  target = 'atlas-art-director'
          }

          emit('agent_start', { agentId: target })

          const contextBlock = context ? `\n\nSprint context:\n${context.slice(0, 600)}` : ''
          let full = ''

          for await (const chunk of streamSynthesis({
            system:    await agentSystem(target) || undefined,
            maxTokens: 500,
            messages: [{
              role: 'user',
              content: `Venture: ${venture}.${contextBlock}\n\nStark says: ${msg}\n\nRespond directly and specifically in your role. Max 180 words. No fluff.`,
            }],
          })) {
            full += chunk
            emit('stream_chunk', { agentId: target, content: chunk })
          }

          emit('agent_message', { agentId: target, content: full, messageType: 'response' })

        // ══════════════════════════════════════════════════════════════
        //  PHASE: BROADCAST — all agents respond to one message
        // ══════════════════════════════════════════════════════════════

        } else if (phase === 'broadcast') {
          const msg = message ?? ''
          const contextBlock = context ? `\n\nContext:\n${context.slice(0, 300)}` : ''

          emit('phase', { phase: 'explore', label: 'All agents responding...' })

          const broadcastAgents = [
            { id: 'kai-analyst',        role: 'Analytics' },
            { id: 'nate-growth',        role: 'Growth' },
            { id: 'rio-ads',            role: 'Channels' },
            { id: 'lena-brand',         role: 'Content' },
            { id: 'atlas-art-director', role: 'Creative' },
          ]

          await Promise.all(broadcastAgents.map(async ({ id, role }) => {
            emit('agent_start', { agentId: id })
            const response = await callFast({
              system:    await agentSystem(id),
              maxTokens: 220,
              messages: [{
                role: 'user',
                content: `Venture: ${venture}.${contextBlock}

The team is discussing: "${msg}"

You are responding as ${role}. Give YOUR specific angle on this — what does it mean from your domain? What's the implication or action? Max 80 words. Lead with the most important point. No intro phrases.`,
              }],
            })
            emit('agent_message', { agentId: id, content: response, messageType: 'response' })
          }))

        // ══════════════════════════════════════════════════════════════
        //  PHASE: VARY — Lena rewrites one pitch
        // ══════════════════════════════════════════════════════════════

        } else if (phase === 'vary') {
          const pitchContext = context ?? ''
          emit('agent_start', { agentId: 'lena-brand' })

          const varied = await callFast({
            system:    await agentSystem('lena-brand'),
            maxTokens: 300,
            messages: [{
              role: 'user',
              content: `Venture: ${venture}.

Original pitch: ${pitchContext}

You are Lena. Rewrite this pitch with a different angle — same platform, different hook style. Make it MORE shareable. Use same format:

Platform: [same platform]
Format: [same or different format]
Hook: [completely different hook — bolder, more specific, or more relatable]
Angle: [new angle]
Tactic: [tactic name]`,
            }],
          })

          const parsed = parsePitches(varied)
          if (parsed.length > 0) {
            const virality = await scoreVirality(parsed[0].hook, parsed[0].angle, parsed[0].platform)
            const pitch: ContentPitch = { ...parsed[0], id: crypto.randomUUID(), virality }
            emit('pitch_variation', { pitch })
          }
          emit('agent_message', { agentId: 'lena-brand', content: varied, messageType: 'response' })
        }

        emit('done', {})

      } catch (err) {
        emit('error', { message: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
