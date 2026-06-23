const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const envContent = readFileSync('/root/yvon/.env.local', 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      envVars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, '');
    }
  }
}

const supabase = createClient(envVars.SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Try SQL query via REST
  const candidateTables = [
    'agent_activity', 'agent_sessions', 'agent_token_usage',
    'analytics_reports', 'analytics_snapshots',
    'competitor_content', 'competitor_metrics', 'competitor_snapshots', 'competitors',
    'growth_baselines', 'growth_metrics',
    'provider_health',
    'reports',
    'skills',
    'social_posts_cache', 'social_snapshots', 'social_stats',
    'toon_stats', 'trending_items', 'activity_feed',
    'ventures', 'ventures_config'
  ];
  
  for (const table of candidateTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(table + ': ERROR - ' + error.message.slice(0, 80));
    } else {
      console.log(table + ': ' + (count ?? '?') + ' rows');
    }
  }
}
main().catch(e => console.error(e.message));
