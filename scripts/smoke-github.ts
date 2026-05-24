/**
 * Smoke test the new Github tool end-to-end through streamWithTools.
 * Run: npx tsx --tsconfig tsconfig.json --env-file=.env.local scripts/smoke-github.ts
 */
import { streamWithTools } from '@/lib/ai-client'

async function runOne(label: string, ventureSlug: string, prompt: string) {
  console.log(`\n══════ ${label} (venture=${ventureSlug}) ══════`)
  let textOut = ''
  let toolCalls = 0
  const t0 = Date.now()

  for await (const event of streamWithTools({
    agentId: 'marcus-ceo',
    ventureSlug,
    maxTokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })) {
    if (event.kind === 'text') textOut += event.text
    else if (event.kind === 'tool_call') {
      toolCalls++
      console.log(`  → ${event.name} ${JSON.stringify(event.input).slice(0, 160)}`)
    } else if (event.kind === 'tool_result') {
      console.log(`  ← ${event.summary}`)
    } else if (event.kind === 'error') {
      console.error(`  ! ${event.message}`)
    } else if (event.kind === 'done') {
      console.log(`  done: ${event.reason}`)
    }
  }
  console.log(`[${label}] tools=${toolCalls} ms=${Date.now() - t0}`)
  console.log(`--- ANSWER ---\n${textOut}\n`)
}

async function main() {
  // The repo Marcus was unsure about
  await runOne(
    'Test A: "does the hourbour repo exist?"',
    'hourbour',
    'Does the GitHub repo for this venture exist? If yes, tell me name + branch + open issue count. If not, say so clearly.',
  )

  await runOne(
    'Test B: "what was the last commit?"',
    'hourbour',
    'What was the most recent commit on this venture\'s GitHub repo? Give SHA, message, author, date.',
  )
}

main().catch(e => { console.error('THROWN:', e); process.exit(1) })
