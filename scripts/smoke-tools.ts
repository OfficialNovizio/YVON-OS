/**
 * Smoke test for the tool loop against the active provider config.
 * Run: npx tsx --env-file=.env.local scripts/smoke-tools.ts
 */
import { streamWithTools } from '@/lib/ai-client'

async function runOne(label: string, agentId: string, prompt: string) {
  console.log(`\n══════ ${label} ══════`)
  let textOut = ''
  let toolCalls = 0
  let iterations = 0
  const t0 = Date.now()

  for await (const event of streamWithTools({
    agentId,
    maxTokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })) {
    if (event.kind === 'text') textOut += event.text
    else if (event.kind === 'tool_call') {
      toolCalls++
      console.log(`  → ${event.name} ${JSON.stringify(event.input).slice(0, 160)}`)
    } else if (event.kind === 'tool_result') {
      console.log(`  ← ${event.summary}`)
    } else if (event.kind === 'iteration') {
      iterations++
    } else if (event.kind === 'error') {
      console.error(`  ! ${event.message}`)
    } else if (event.kind === 'done') {
      console.log(`  done: ${event.reason}`)
    }
  }

  console.log(`[${label}] iter=${iterations} tools=${toolCalls} ms=${Date.now() - t0}`)
  console.log(`--- answer ---\n${textOut}\n`)
}

async function main() {
  // Test 1: multi-tool exploration (Glob + Read)
  await runOne(
    'Test 1: Multi-tool (Glob + Read)',
    'dev-lead',
    'Find all files under app/api/health/ and tell me what the route.ts exports. Use Glob then Read.',
  )

  // Test 2: code search (Grep)
  await runOne(
    'Test 2: Code search (Grep)',
    'raj-backend',
    'Use Grep to find every place "saveWarRoomPlan" is used. Report the files and what they do (1 sentence each).',
  )

  // Test 3: shell allowlist (Bash git log)
  await runOne(
    'Test 3: Shell allowlist (Bash)',
    'quinn-qa',
    'Run "git log --oneline -3" to see recent commits, then report what they say.',
  )

  // Test 4: hallucination resistance — agent should refuse or check
  await runOne(
    'Test 4: Hallucination resistance',
    'mia-frontend',
    'Tell me what the file app/screens/imaginary-page/page.tsx contains. Be honest if it does not exist.',
  )
}

main().catch(e => { console.error('THROWN:', e); process.exit(1) })
