/**
 * Smoke test the Agent SDK directly against the active provider config.
 * Run: npx tsx --env-file=.env.local scripts/smoke-agent-sdk.ts
 *
 * This DOES NOT need the team-chat route — it imports the SDK directly,
 * builds the env from the DB row (DeepSeek /anthropic), and runs one query.
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import { createClient } from '@supabase/supabase-js'

async function getProviderEnv() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await sb
    .from('ai_provider_keys')
    .select('provider, api_key, fast_model, synthesis_model, base_url')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) throw new Error('No active provider row')
  return {
    apiKey:    data.api_key as string,
    baseUrl:   (data.base_url as string | null) ?? 'https://api.anthropic.com',
    fastModel: (data.fast_model as string) || '',
  }
}

async function main() {
  const cfg = await getProviderEnv()
  console.log(`Provider config:  baseUrl=${cfg.baseUrl}  fastModel=${cfg.fastModel}  key=${cfg.apiKey.slice(0,8)}…`)

  console.log('\nSpawning Claude Agent SDK subprocess…')
  const t0 = Date.now()
  let assistantText = ''
  let toolCalls = 0
  let messageCount = 0
  let initialized = false

  try {
    const q = query({
      prompt: 'List 3 files in the current directory using the Glob tool, then summarize what they are. Be brief.',
      options: {
        cwd:          process.cwd(),
        model:        cfg.fastModel,
        allowedTools: ['Read', 'Glob', 'Grep'],
        env: {
          ...process.env,
          ANTHROPIC_API_KEY:    cfg.apiKey,
          ANTHROPIC_AUTH_TOKEN: cfg.apiKey,
          ANTHROPIC_BASE_URL:   cfg.baseUrl,
          API_TIMEOUT_MS:       '60000',
        },
      },
    })

    for await (const msg of q) {
      messageCount++
      const m = msg as { type: string; subtype?: string; message?: { content?: Array<{ type: string; text?: string; name?: string; input?: unknown }> }; result?: string; session_id?: string }

      if (m.type === 'system' && m.subtype === 'init') {
        initialized = true
        console.log(`  → init   session=${m.session_id?.slice(0,8)}  (${Date.now()-t0}ms)`)
      } else if (m.type === 'assistant') {
        const blocks = m.message?.content ?? []
        for (const b of blocks) {
          if (b.type === 'text' && b.text) { assistantText += b.text }
          else if (b.type === 'tool_use') {
            toolCalls++
            console.log(`  → tool   ${b.name}  ${JSON.stringify(b.input).slice(0,100)}`)
          }
        }
      } else if (m.type === 'result') {
        console.log(`  → result  subtype=${m.subtype}  (${Date.now()-t0}ms)`)
        if (m.result && !assistantText.includes(m.result)) assistantText = m.result
      }
      // Stop printing after 30 messages to keep output sane
      if (messageCount > 200) break
    }
  } catch (e) {
    console.error('\nSDK THREW:', e instanceof Error ? e.message : e)
    process.exit(2)
  }

  console.log(`\n===== SMOKE RESULT =====`)
  console.log(`Subprocess initialized: ${initialized ? '✓' : '✗ NEVER RECEIVED init MESSAGE'}`)
  console.log(`Tool calls fired:       ${toolCalls}`)
  console.log(`Total messages:         ${messageCount}`)
  console.log(`Elapsed:                ${Date.now() - t0}ms`)
  console.log(`\n--- ASSISTANT TEXT ---\n${assistantText || '(empty)'}\n`)
  if (!initialized || messageCount === 0) {
    console.log('VERDICT: ✗ SDK did NOT run against DeepSeek endpoint successfully.')
    process.exit(1)
  } else if (toolCalls === 0 && !assistantText) {
    console.log('VERDICT: ? SDK started but produced no useful output.')
    process.exit(1)
  } else {
    console.log('VERDICT: ✓ Agent SDK works against your DeepSeek /anthropic endpoint.')
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
