/**
 * lib/tool-loop.ts — Anthropic Messages API tool_use loop with streaming.
 *
 * Mirrors what Claude Code (Agent SDK) does internally, but runs on the Client SDK
 * so it works with any Anthropic-wire-compatible endpoint (incl. DeepSeek /anthropic).
 *
 * Yields a typed event stream:
 *   { kind: 'text', text }             — forward to client
 *   { kind: 'tool_call', name, input } — agent decided to call a tool
 *   { kind: 'tool_result', name, summary, is_error } — tool finished
 *   { kind: 'iteration', n }           — new turn of the loop
 *   { kind: 'done', reason }           — loop ended
 *   { kind: 'error', message }         — fatal error
 */

import type Anthropic from '@anthropic-ai/sdk'
import { executeTool, type ToolContext } from './agent-tools'
import type { ThinkingConfig } from './ai-client'

export type ToolLoopEvent =
  | { kind: 'text';        text: string }
  | { kind: 'tool_call';   name: string; input: unknown; tool_use_id: string }
  | { kind: 'tool_result'; name: string; summary: string; is_error: boolean; tool_use_id: string; todoItems?: Array<{ content: string; status: string; activeForm: string }> | null }
  | { kind: 'iteration';   n: number }
  | { kind: 'done';        reason: string }
  | { kind: 'error';       message: string }

export interface ToolLoopOptions {
  client:        Anthropic
  model:         string
  maxTokens:     number
  system?:       string
  /** Extended/Adaptive thinking config (Claude models only). */
  thinking?:     ThinkingConfig
  tools:         Anthropic.Messages.Tool[]
  initialMessages: Anthropic.Messages.MessageParam[]
  /** Cap on how many tool_use rounds. Prevents runaway loops. Default 8. */
  maxIterations?: number
  /** Per-session context for tools that need it (e.g. ventureSlug for Github tool). */
  toolContext?:  ToolContext
}

const DEFAULT_MAX_ITERATIONS = 30
const CACHE_MIN_CHARS = 2000

/**
 * Anthropic allows at most 4 blocks with `cache_control` per request.
 *
 * The previous implementation stamped `cache_control` on the system prompt PLUS
 * every large tool result, and those breakpoints persisted in the message array
 * across iterations. A read-heavy turn (e.g. CEO verification reading 5+ files)
 * accumulated >4 breakpoints and the API rejected the ENTIRE request — killing
 * the loop mid-task with an error ("stops at 'let me verify…'").
 *
 * Fix: keep stored tool results clean (no cache_control) and, at send time,
 * place a SINGLE breakpoint on the most recent large tool result. Anthropic
 * caches the entire prefix up to a breakpoint, so one trailing breakpoint
 * (plus the system breakpoint = 2 total) preserves the token savings while
 * never exceeding the 4-block ceiling, regardless of how many tools run.
 */
function withTrailingCacheBreakpoint(
  messages: Anthropic.Messages.MessageParam[],
): Anthropic.Messages.MessageParam[] {
  for (let mi = messages.length - 1; mi >= 0; mi--) {
    const msg = messages[mi]
    if (msg.role !== 'user' || !Array.isArray(msg.content)) continue

    let placed = false
    const newContent = msg.content.map(block => {
      if (placed || typeof block !== 'object' || block.type !== 'tool_result') return block
      const c = block.content
      const text = typeof c === 'string'
        ? c
        : Array.isArray(c)
          ? c.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
          : ''
      if (text.length <= CACHE_MIN_CHARS) return block
      placed = true
      return {
        ...block,
        content: [{ type: 'text' as const, text, cache_control: { type: 'ephemeral' as const } }],
      }
    })

    if (placed) {
      const cloned = [...messages]
      cloned[mi] = { ...msg, content: newContent }
      return cloned
    }
  }
  return messages
}

export async function* runToolLoop(opts: ToolLoopOptions): AsyncGenerator<ToolLoopEvent> {
  const messages: Anthropic.Messages.MessageParam[] = [...opts.initialMessages]
  const maxIter = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS

  for (let i = 1; i <= maxIter; i++) {
    yield { kind: 'iteration', n: i }

    const stream = opts.client.messages.stream({
      model:      opts.model,
      max_tokens: opts.maxTokens,
      ...(opts.thinking ? { thinking: opts.thinking } : {}),
      tools:      opts.tools,
      // Single trailing cache breakpoint — see withTrailingCacheBreakpoint.
      // Never exceeds Anthropic's 4-block cache_control ceiling.
      messages:   withTrailingCacheBreakpoint(messages),
      // Cache system prompt across all iterations — specialist system prompts are
      // 15-30 KB. Without caching, each of 20 iterations pays the full input cost.
      // With caching, iterations 2-20 skip system prompt processing entirely.
      ...(opts.system ? {
        system: [{ type: 'text' as const, text: opts.system, cache_control: { type: 'ephemeral' as const } }],
      } : {}),
    })

    // Stream text deltas to the caller while the model produces its response.
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { kind: 'text', text: event.delta.text }
      }
    }

    let finalMessage: Anthropic.Messages.Message
    try {
      finalMessage = await stream.finalMessage()
    } catch (e) {
      yield { kind: 'error', message: e instanceof Error ? e.message : String(e) }
      return
    }

    // Append assistant message (including any tool_use blocks) to history.
    messages.push({ role: 'assistant', content: finalMessage.content })

    if (finalMessage.stop_reason !== 'tool_use') {
      yield { kind: 'done', reason: finalMessage.stop_reason ?? 'end_turn' }
      return
    }

    // Execute each tool_use block and collect tool_results for the next turn.
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
    for (const block of finalMessage.content) {
      if (block.type !== 'tool_use') continue
      yield { kind: 'tool_call', name: block.name, input: block.input, tool_use_id: block.id }

      const result = await executeTool(block.name, block.input, opts.toolContext ?? {})
      // For TodoWrite, include parsed todo items so the UI can render them visually
      const todoItems = block.name === 'TodoWrite' && !result.is_error
        ? (block.input as { todos?: Array<{ content: string; status: string; activeForm: string }> })?.todos ?? null
        : null
      yield {
        kind: 'tool_result',
        name: block.name,
        summary: result.summary,
        is_error: result.is_error,
        tool_use_id: block.id,
        todoItems,
      }

      // Store tool results WITHOUT cache_control — the breakpoint is applied
      // dynamically at send time (withTrailingCacheBreakpoint) so we never
      // accumulate more than the 4-block cache_control limit across iterations.
      toolResults.push({
        type:        'tool_result',
        tool_use_id: block.id,
        content:     result.content,
        is_error:    result.is_error,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  yield { kind: 'done', reason: 'max_iterations_reached' }
}
