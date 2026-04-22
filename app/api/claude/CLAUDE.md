# CLAUDE.md — app/api/claude/

> Parent rules: see `/YVON/app/api/CLAUDE.md`.

## What this route does

Central AI proxy for all 5 agents. Accepts a POST request and streams the Anthropic response back as **server-sent events (SSE)**.

## Request body (`ClaudeRequestBody`)

```ts
{
  agentName:    string   // e.g. "marketing-agent"
  systemPrompt: string   // full system prompt (default + skills extension merged by client)
  userMessage:  string   // the user's message
  model:        string   // e.g. "claude-sonnet-4-6"
}
```

## Response format

`Content-Type: text/event-stream` — each chunk is:
```
data: {"text": "…delta text…"}\n\n
```
Terminated with:
```
data: [DONE]\n\n
```
On error:
```
data: {"error": "…message…"}\n\n
```

## Key implementation notes

- Uses `@anthropic-ai/sdk` `messages.stream()` iterated with `for await`.
- `ReadableStream` is constructed inline and returned as the `Response` body.
- `max_tokens` is hardcoded to `4096` — increase only if agents need longer outputs.
- The `agentName` field is accepted but not used server-side (it's for client-side logging/history).
- Model falls back to `claude-sonnet-4-6` if the `model` field is missing.

## Do not

- Never log `userMessage` or `systemPrompt` contents — they may contain sensitive business data.
- Never cache SSE responses — `Cache-Control: no-cache` must stay.
