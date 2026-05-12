import { NextRequest } from 'next/server'
import { callFast } from '@/lib/ai-client'
import { getStrategyLog, updateStrategyLogResult, appendLearnedActivation } from '@/lib/db'

export const maxDuration = 30
import type { LearnedActivation } from '@/lib/types'

// POST /api/kahneman/results
// Triggered by @kahneman results command when Stark fills in strategy log results.
// Reads the completed entry, extracts mechanism, updates skill learned_activations.

interface ResultsBody {
  strategyLogId: string
  result: string
  diagnosis?: string
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: ResultsBody
  try {
    body = await request.json() as ResultsBody
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { strategyLogId, result, diagnosis } = body
  if (!strategyLogId || !result) {
    return Response.json({ error: 'strategyLogId and result are required' }, { status: 400 })
  }

  try {
    // Find the strategy log entry
    // We search by ID across both brands — load recent logs and find by ID
    const novizioLog = await getStrategyLog('Novizio', undefined, 50)
    const hourbourLog = await getStrategyLog('Hourbour', undefined, 50)
    const entry = [...novizioLog, ...hourbourLog].find(e => e.id === strategyLogId)

    if (!entry) {
      return Response.json({ error: 'Strategy log entry not found' }, { status: 404 })
    }

    // Kahneman extracts mechanism via fast model
    const mechanismNote = await callFast({
      messages: [{
        role: 'user',
        content: `You are Kahneman. A strategy log entry has completed. Extract the psychological mechanism.

Brand: ${entry.brand}
Surface: ${entry.surface}
Lever used: ${entry.lever} (Layer ${entry.layerNumber})
Run recommendation: Variant ${entry.runRecommendation}
Result: ${result}
Diagnosis: ${diagnosis ?? 'not provided'}

In 2 sentences, state:
1. Whether the lever hypothesis was confirmed or rejected
2. The specific psychological mechanism that drove the result (or caused failure)

Be precise. No hedging.`,
      }],
      maxTokens: 200,
    }).then(t => t.trim()).catch(() => '')
    const mechanismConfirmed = result.toLowerCase().includes('work') ||
                               result.toLowerCase().includes('success') ||
                               result.toLowerCase().includes('positive')

    // Update strategy log with results
    await updateStrategyLogResult(
      strategyLogId,
      result,
      diagnosis ?? mechanismNote,
      mechanismConfirmed,
      `Try ${mechanismConfirmed ? 'evolving' : 'replacing'} ${entry.lever} — ${mechanismNote.slice(0, 80)}`
    )

    // Append learned activation to the skill file in DB
    const skillName = 'consumer-psychology-lean' // default; deep sessions would pass a different name
    const activation: LearnedActivation = {
      date:          new Date().toISOString().slice(0, 10),
      brand:         entry.brand,
      surface:       entry.surface,
      lever:         entry.lever,
      result:        mechanismConfirmed ? 'worked' : 'failed',
      mechanismNote: mechanismNote.slice(0, 200),
    }

    await appendLearnedActivation(skillName, activation)

    return Response.json({
      ok: true,
      mechanismConfirmed,
      mechanismNote,
      learnedActivationSaved: true,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
