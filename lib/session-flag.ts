/**
 * lib/session-flag.ts — the on/off switch for the per-session engine (A1).
 *
 * Stored as a Vault setting (Settings → Agents toggle), NOT an env var — .env is
 * deprecated. Kept separate from lib/session.ts so that module stays pure and
 * unit-testable (this one imports `server-only` transitively via getSecret).
 */
import { getSecret } from '@/lib/secrets'

/** Off unless the WAR_ROOM_ENGINE_V2 setting is 1/true/on. getSecret is cached (60s TTL). */
export async function isEngineV2Enabled(): Promise<boolean> {
  const v = (await getSecret('WAR_ROOM_ENGINE_V2'))?.toLowerCase()
  return v === '1' || v === 'true' || v === 'on'
}
