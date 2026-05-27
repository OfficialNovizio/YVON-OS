import { isAgentSdkEnabled } from '@/lib/agent-sdk-runner'
import { getActiveProviderInfo } from '@/lib/ai-client'

export async function GET() {
  const [isAgent, providerInfo] = await Promise.all([
    isAgentSdkEnabled(),
    getActiveProviderInfo(),
  ])
  return Response.json({
    engine:         isAgent ? 'agent_sdk' : 'client_sdk',
    fastModel:      providerInfo?.fastModel ?? 'claude-haiku-4-5-20251001',
    synthesisModel: providerInfo?.synthesisModel ?? 'claude-sonnet-4-6',
    provider:       providerInfo?.provider ?? 'anthropic',
  })
}
