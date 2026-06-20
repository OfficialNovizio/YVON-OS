// ⚠️ TOONGINE-HIGH-BLAST-RADIUS: High blast radius — 82 importers. Consider splitting.
// High blast radius — 82 importers. Consider splitting.
import 'server-only'
import { createClient } from '@supabase/supabase-js'

// createClient does not throw on invalid URLs — actual requests will fail at runtime
// which is the correct behavior for build-time static analysis
export const supabase = createClient(
  process.env.SUPABASE_URL     ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
)
