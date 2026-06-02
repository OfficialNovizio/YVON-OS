/**
 * lib/agent-sdk-runner.ts — Claude Agent SDK wrapper.
 *
 * Wraps @anthropic-ai/claude-agent-sdk's query() into the same ToolLoopEvent shape
 * the rest of War Room speaks, so the team-chat route can switch engines transparently.
 *
 * Uses per-call `env` to route the underlying Claude Code subprocess through whichever
 * Anthropic-compatible endpoint the active provider row points at (DeepSeek /anthropic
 * by default). Tools are restricted to a read-only subset — no Write/Edit/DeleteFile/Bash
 * is exposed by default because War Room is browser-triggered (RCE risk).
 *
 * Toggle via env: WAR_ROOM_ENGINE=agent_sdk
 */

import { query as agentQuery } from '@anthropic-ai/claude-agent-sdk'
import { loadConfig } from '@/lib/ai-client'
import type { ToolLoopEvent } from '@/lib/tool-loop'

/** Read-only Claude Code tools the agent is allowed to use in War Room. */
const SAFE_TOOLS = [
  'Read',
  'Glob',
  'Grep',
  // 'Bash' — intentionally excluded. Re-enable per-agent if you want shell access.
  // 'Write' / 'Edit' / 'DeleteFile' / 'RenameFile' / 'CreateDirectory' / 'DeleteDirectory'
  // — excluded for safety. War Room messages come from the browser.
] as const

/**
 * Per-agent allowed tools mapping. Same tier structure as the Client-SDK path.
 * If you want to give specific agents Bash access, add 'Bash' to their list here.
 */
const AGENT_SDK_TOOLS: Record<string, readonly string[]> = {
  'marcus-ceo':    [...SAFE_TOOLS, 'Bash'],
  'diana-coo':     [...SAFE_TOOLS, 'Bash'],
  'dev-lead':      [...SAFE_TOOLS, 'Bash'],
  'raj-backend':   [...SAFE_TOOLS, 'Bash'],
  'quinn-qa':      [...SAFE_TOOLS, 'Bash'],
  'mia-frontend':  [...SAFE_TOOLS],
  'kai-analyst':   [...SAFE_TOOLS],
  'felix-finance': [...SAFE_TOOLS],
  'lena-brand':    [...SAFE_TOOLS],
  'rio-ads':       [...SAFE_TOOLS],
  'atlas-art-director': [...SAFE_TOOLS],
  'pixel-production':   [...SAFE_TOOLS],
  'nate-growth':        [...SAFE_TOOLS],
  'daniel-kahneman':    [...SAFE_TOOLS],
}

// Provider config is loaded from the shared ai-client loader (single 60 s cache,
// no duplication). This also gives agent SDK the tier1Model (Opus) for dev-lead/raj.

export interface AgentSdkRunOptions {
  agentId:       string
  systemPrompt:  string
  userPrompt:    string
  modelTier?:    'fast' | 'synthesis' | 'tier1'
  /** Override allowed tools (defaults to per-agent SAFE_TOOLS list). */
  allowedTools?: string[]
  /** Cwd for the subprocess. Default: project root. */
  cwd?:          string
  /** Hard cap on subprocess runtime. Default 180s. */
  timeoutMs?:    number
}

/**
 * Run a single agent task through the Claude Agent SDK and yield ToolLoopEvent.
 *
 * Pros (vs the Client-SDK tool loop): full Claude Code engine — better-trained
 * tool patterns, native subagent/MCP/skill support, smarter context window mgmt.
 *
 * Cons: spawns a subprocess (slow start ~2-5s); env is set per-call so concurrent
 * agents are safe but each pays the spawn tax.
 */
export async function* runAgentSdk(opts: AgentSdkRunOptions): AsyncGenerator<ToolLoopEvent> {
  const cfg = await loadConfig()
  const model = opts.modelTier === 'synthesis'
    ? cfg.synthesisModel
    : opts.modelTier === 'tier1'
    ? (cfg.tier1Model || cfg.synthesisModel)
    : cfg.fastModel
  const allowedTools = opts.allowedTools ?? AGENT_SDK_TOOLS[opts.agentId] ?? SAFE_TOOLS

  yield { kind: 'iteration', n: 1 }

  let textBuffer = ''
  let lastEmittedLen = 0
  const t0 = Date.now()
  const timeoutMs = opts.timeoutMs ?? 180_000

  try {
    // SDK behavior: allowedTools restricts the allowlist but Bash/Write/Edit can still
    // sneak in if the model decides to use them (verified via smoke test). Belt-and-
    // suspenders: explicitly disallow every dangerous write/delete tool, and disallow
    // Bash for any agent whose tier doesn't include it.
    const wantsBash = allowedTools.includes('Bash')
    const disallowedTools = [
      'Write', 'Edit', 'NotebookEdit',
      'DeleteFile', 'RenameFile',
      'CreateDirectory', 'DeleteDirectory',
      ...(wantsBash ? [] : ['Bash']),
    ]

    const q = agentQuery({
      prompt: opts.userPrompt,
      options: {
        cwd:             opts.cwd ?? process.cwd(),
        model,
        allowedTools:    [...allowedTools],
        disallowedTools,
        systemPrompt:    opts.systemPrompt,
        includePartialMessages: true,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY:    cfg.apiKey,
          ANTHROPIC_BASE_URL:   cfg.baseUrl,
          // Authorization header too — DeepSeek's compat layer expects Bearer
          ANTHROPIC_AUTH_TOKEN: cfg.apiKey,
          API_TIMEOUT_MS:       '120000',
        },
      },
    })

    for await (const msg of q) {
      if (Date.now() - t0 > timeoutMs) {
        yield { kind: 'error', message: `Agent SDK timeout after ${timeoutMs}ms` }
        return
      }

      const m = msg as { type: string; subtype?: string; message?: { content?: Array<{ type: string; text?: string; name?: string; input?: unknown; id?: string }> }; result?: string; session_id?: string }

      switch (m.type) {
        case 'system':
          // init message — session_id available but we don't surface it yet
          break

        case 'assistant': {
          // Assistant turn — may contain text and/or tool_use blocks
          const blocks = m.message?.content ?? []
          for (const block of blocks) {
            if (block.type === 'text' && typeof block.text === 'string') {
              textBuffer += block.text
            } else if (block.type === 'tool_use' && block.name) {
              yield {
                kind: 'tool_call',
                name: block.name,
                input: block.input,
                tool_use_id: block.id ?? '',
              }
            }
          }
          // Stream any new text since last emit
          if (textBuffer.length > lastEmittedLen) {
            const newText = textBuffer.slice(lastEmittedLen)
            lastEmittedLen = textBuffer.length
            yield { kind: 'text', text: newText }
          }
          break
        }

        case 'user': {
          // Tool results come back as user messages with tool_result blocks
          const blocks = (m as { message?: { content?: Array<{ type: string; tool_use_id?: string; content?: string | Array<{ type: string; text?: string }>; is_error?: boolean }> } }).message?.content ?? []
          for (const block of blocks) {
            if (block.type === 'tool_result') {
              const contentText = typeof block.content === 'string'
                ? block.content
                : Array.isArray(block.content)
                  ? block.content.map(c => c.text ?? '').join(' ').trim()
                  : ''
              yield {
                kind: 'tool_result',
                name: '(tool)',
                summary: contentText.slice(0, 120),
                is_error: !!block.is_error,
                tool_use_id: block.tool_use_id ?? '',
              }
            }
          }
          break
        }

        case 'result':
          // Final result message — if there's a `result` field, ensure any tail text is flushed
          if (m.subtype === 'success' && typeof m.result === 'string' && m.result.length > lastEmittedLen) {
            const tail = m.result.slice(lastEmittedLen)
            if (tail) yield { kind: 'text', text: tail }
          }
          yield { kind: 'done', reason: m.subtype ?? 'success' }
          return

        default:
          // Other message types (status, task_progress, hook_*, etc.) — ignore for now.
          break
      }
    }

    yield { kind: 'done', reason: 'stream_closed' }
  } catch (e) {
    yield { kind: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

import { getSecret } from '@/lib/secrets'

export async function isAgentSdkEnabled(): Promise<boolean> {
  const v = await getSecret('WAR_ROOM_ENGINE')
  return v === 'agent_sdk'
}
