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
  // agent_sessions: distribution
  console.log('=== agent_sessions distribution ===');
  const { data: sess } = await supabase.from('agent_sessions').select('venture, agent_id, created_at').order('created_at', { ascending: false }).limit(200);
  if (sess) {
    const byDayVenture = {};
    const byAgent = {};
    for (const r of sess) {
      const day = r.created_at.slice(0, 10);
      const v = r.venture || '?';
      const key = day + '|' + v;
      byDayVenture[key] = (byDayVenture[key] || 0) + 1;
      byAgent[r.agent_id || '?'] = (byAgent[r.agent_id || '?'] || 0) + 1;
    }
    console.log('By day+venture:');
    for (const [k, c] of Object.entries(byDayVenture).sort()) {
      const [d, v] = k.split('|');
      console.log('  ' + d + ' ' + v + ': ' + c);
    }
    console.log('\nBy agent:');
    for (const [a, c] of Object.entries(byAgent).sort((a,b) => b[1]-a[1])) {
      console.log('  ' + a + ': ' + c);
    }
    console.log('Total sessions: ' + sess.length);
  }

  // agent_token_usage
  console.log('\n=== agent_token_usage (last 20) ===');
  const { data: tokens } = await supabase.from('agent_token_usage').select('*').order('date', { ascending: false }).limit(20);
  if (tokens) {
    for (const r of tokens) {
      console.log('  ' + r.date + ' | ' + r.agent_name + ' | ' + r.tokens + ' tok | $' + (r.cost || 0) + ' | ' + r.department);
    }
  }

  // provider_health
  console.log('\n=== provider_health ===');
  const { data: ph } = await supabase.from('provider_health').select('*');
  if (ph) {
    for (const r of ph) {
      console.log('  ' + r.provider + ': usage=' + r.usage_percent + '% balance=' + (r.balance || 'N/A') + ' configured=' + r.configured);
    }
  }

  // skills
  console.log('\n=== skills ===');
  const { data: sk } = await supabase.from('skills').select('*');
  if (sk) {
    for (const r of sk) {
      console.log('  ' + r.name + ': use_count=' + r.use_count + ' state=' + r.lifecycle_state + ' last_used=' + (r.last_used_at || 'N/A'));
    }
  }

  // competitor_metrics detail
  console.log('\n=== competitor_metrics ===');
  const { data: cmetrics } = await supabase.from('competitor_metrics').select('*');
  if (cmetrics) {
    for (const r of cmetrics) {
      console.log('  competitor: ' + r.competitor_id + ' | metric: ' + (r.metric_name || 'N/A') + ' | value: ' + (r.metric_value || 'N/A') + ' | date: ' + (r.metric_date || 'N/A'));
    }
  }

  // analytics_reports
  console.log('\n=== analytics_reports ===');
  const { data: ar } = await supabase.from('analytics_reports').select('*').limit(5);
  console.log('Count: ' + (ar ? ar.length : 0));
  if (ar) for (const r of ar) console.log('  ' + r.venture_id + ' | ' + r.period + ' | ' + r.created_at);

  // toon_stats
  console.log('\n=== toon_stats ===');
  const { data: ts } = await supabase.from('toon_stats').select('*');
  if (ts) for (const r of ts) console.log('  ' + r.category + ': compression=' + r.compression_pct + '% grade=' + r.grade);
}

main().catch(e => { console.error(e.message); process.exit(1) });
