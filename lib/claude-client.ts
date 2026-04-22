// Client-side SSE consumer — safe to import in client components.
// Never imports API keys; only calls /api/claude.

export interface StreamMessageOptions {
  agentName: string
  systemPrompt: string
  userMessage: string
  model: string
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export async function streamMessage(options: StreamMessageOptions): Promise<void> {
  const { agentName, systemPrompt, userMessage, model, onChunk, onComplete, onError } = options

  let response: Response
  try {
    response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentName, systemPrompt, userMessage, model }),
    })
  } catch (err) {
    onError(new Error(`Network error: ${String(err)}`))
    return
  }

  if (!response.ok) {
    onError(new Error(`API error: ${response.status} ${response.statusText}`))
    return
  }

  if (!response.body) {
    onError(new Error('Response body is null'))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      // Each SSE line is: "data: <text>\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data) as { text?: string }
            if (parsed.text) onChunk(parsed.text)
          } catch {
            // Non-JSON data line — skip
          }
        }
      }
    }
    onComplete()
  } catch (err) {
    onError(new Error(`Stream error: ${String(err)}`))
  } finally {
    reader.releaseLock()
  }
}
