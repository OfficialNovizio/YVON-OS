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

export type ToolLoopEvent =
  | { kind: 'text';        text: string }
  | { kind: 'tool_call';   name: string; input: unknown; tool_use_id: string }
  | { kind: 'tool_result'; name: string; summary: string; is_error: boolean; tool_use_id: string }
  | { kind: 'iteration';   n: number }
  | { kind: 'done';        reason: string }
  | { kind: 'error';       message: string }

export interface ToolLoopOptions {
  client:        Anthropic
  model:         string
  maxTokens:     number
  system?:       string
  tools:         Anthropic.Messages.Tool[]
  initialMessages: Anthropic.Messages.MessageParam[]
  /** Cap on how many tool_use rounds. Prevents runaway loops. Default 8. */
  maxIterations?: number
  /** Per-session context for tools that need it (e.g. ventureSlug for Github tool). */
  toolContext?:  ToolContext
}

const DEFAULT_MAX_ITERATIONS = 8

export async function* runToolLoop(opts: ToolLoopOptions): AsyncGenerator<ToolLoopEvent> {
  const messages: Anthropic.Messages.MessageParam[] = [...opts.initialMessages]
  const maxIter = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS

  for (let i = 1; i <= maxIter; i++) {
    yield { kind: 'iteration', n: i }

    const stream = opts.client.messages.stream({
      model:      opts.model,
      max_tokens: opts.maxTokens,
      tools:      opts.tools,
      messages,
      ...(opts.system ? { system: opts.system } : {}),
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
      yield {
        kind: 'tool_result',
        name: block.name,
        summary: result.summary,
        is_error: result.is_error,
        tool_use_id: block.id,
      }

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
