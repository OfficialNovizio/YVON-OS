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
  console.log('=== KAI MORNING QUERY ===');
  console.log('Timestamp: ' + new Date().toISOString());
  
  // 1. social_snapshots
  console.log('\n--- social_snapshots ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('social_snapshots')
      .select('id, venture_id, platform, captured_at, data')
      .eq('venture_id', venture)
      .order('captured_at', { ascending: false })
      .limit(10);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' rows');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        const followers = row.data ? (row.data.followersCount || row.data.followers || row.data.follower_count || 'N/A') : 'N/A';
        console.log('  - ' + row.platform + ' | ' + row.captured_at + ' | followers: ' + followers);
      }
    }
  }

  // 2. social_posts_cache
  console.log('\n--- social_posts_cache ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('social_posts_cache')
      .select('id, venture_id, platform, post_date, caption, post_url, scraped_at')
      .eq('venture_id', venture)
      .order('post_date', { ascending: false })
      .limit(20);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' rows');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        const cap = row.caption ? row.caption.slice(0, 80) : '(no caption)';
        console.log('  - ' + row.platform + ' | ' + row.post_date + ' | ' + cap);
      }
    }
  }

  // 3. competitors
  console.log('\n--- competitors ---');
  const { data: competitors, error: compErr } = await supabase
    .from('competitors')
    .select('*')
    .limit(50);
  console.log('Total: ' + (competitors ? competitors.length : 0) + ' rows');
  if (compErr) console.log('  ERROR: ' + compErr.message);
  if (competitors && competitors.length > 0) {
    for (const row of competitors) {
      const name = row.brand_name || row.name || row.handle || row.id;
      console.log('  - ' + name + ' | venture: ' + (row.venture_id || 'N/A') + ' | platform: ' + (row.platform || 'N/A'));
    }
  }

  // 4. competitor_snapshots
  console.log('\n--- competitor_snapshots ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('competitor_snapshots')
      .select('id, venture_id, platform, competitor_url, captured_at, kai_analysis')
      .eq('venture_id', venture)
      .order('captured_at', { ascending: false })
      .limit(20);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' rows');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        let kaiSummary = '';
        if (row.kai_analysis) {
          const a = typeof row.kai_analysis === 'object' ? row.kai_analysis : {};
          kaiSummary = 'kai_severity: ' + (a.severity || a.threat_level || 'N/A') + ' | summary: ' + ((a.summary || '').slice(0, 100));
        }
        console.log('  - ' + row.platform + ' | ' + (row.competitor_url || 'N/A') + ' | ' + row.captured_at + ' | ' + kaiSummary);
      }
    }
  }

  // 5. agent_sessions
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  console.log('\n--- agent_sessions (last 30d, since ' + since.slice(0, 10) + ') ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('agent_id, tokens_used, cost_usd, created_at')
      .eq('venture', venture)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' sessions');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      const byDay = {};
      for (const row of data) {
        const day = row.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { total: 0, agents: {} };
        byDay[day].total++;
        const agent = row.agent_id || 'unknown';
        byDay[day].agents[agent] = (byDay[day].agents[agent] || 0) + 1;
      }
      for (const [day, info] of Object.entries(byDay).sort()) {
        const agentStr = Object.entries(info.agents).map(([a, c]) => a + ':' + c).join(', ');
        console.log('  ' + day + ': ' + info.total + ' [' + agentStr + ']');
      }
    }
  }

  // 6. analytics_snapshots
  console.log('\n--- analytics_snapshots ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('analytics_snapshots')
      .select('id, venture_id, captured_at, data')
      .eq('venture_id', venture)
      .order('captured_at', { ascending: false })
      .limit(10);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' rows');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        const sessions = row.data ? (row.data.sessions || row.data.totalSessions || 'N/A') : 'N/A';
        console.log('  - ' + row.captured_at + ' | sessions: ' + sessions);
      }
    }
  }

  // 7. growth_baselines
  console.log('\n--- growth_baselines ---');
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('growth_baselines')
      .select('*')
      .eq('venture_id', venture)
      .order('platform');
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' rows');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        console.log('  - ' + row.platform + '/' + row.metric_key + ': ' + row.baseline_value + ' (set ' + row.baseline_date + ' by ' + row.set_by + ')');
      }
    }
  }

  // 8. ventures
  console.log('\n--- ventures ---');
  const { data: ventures, error: ventErr } = await supabase
    .from('ventures')
    .select('*');
  console.log('Total: ' + (ventures ? ventures.length : 0));
  if (ventErr) console.log('  ERROR: ' + ventErr.message);
  if (ventures && ventures.length > 0) {
    for (const v of ventures) {
      console.log('  - slug: ' + v.slug + ' | name: ' + (v.venture_name || v.name || 'N/A') + ' | ig: ' + (v.instagram_handle || 'N/A') + ' | ga4: ' + (v.ga4_property_id || 'N/A') + ' | website: ' + (v.website_url || 'N/A'));
    }
  }

  // 9. activity_feed
  console.log('\n--- activity_feed (last 14d) ---');
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  for (const venture of ['novizio', 'hourbour']) {
    const { data, error } = await supabase
      .from('activity_feed')
      .select('*')
      .eq('venture_id', venture)
      .gte('created_at', since14d)
      .order('created_at', { ascending: false })
      .limit(30);
    console.log('\n' + venture + ': ' + (data ? data.length : 0) + ' events');
    if (error) console.log('  ERROR: ' + error.message);
    if (data && data.length > 0) {
      for (const row of data) {
        console.log('  - ' + row.created_at + ' | ' + row.type + ' | ' + row.message.slice(0, 100));
      }
    }
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1) });
