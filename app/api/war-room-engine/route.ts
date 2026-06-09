import { isAgentSdkEnabled } from '@/lib/agent-sdk-runner'
import { getActiveProviderInfo } from '@/lib/ai-client'
import { isEngineV2Enabled } from '@/lib/session-flag'

export async function GET() {
  const [isAgent, providerInfo, engineV2] = await Promise.all([
    isAgentSdkEnabled(),
    getActiveProviderInfo(),
    isEngineV2Enabled(),
  ])
  return Response.json({
    engine:         isAgent ? 'agent_sdk' : 'client_sdk',
    engineV2,       // per-session isolation engine (A1) — toggled in Settings → Agents
    fastModel:      providerInfo?.fastModel ?? 'claude-sonnet-4-6',
    synthesisModel: providerInfo?.synthesisModel ?? 'claude-sonnet-4-6',
    provider:       providerInfo?.provider ?? 'anthropic',
  })
}
