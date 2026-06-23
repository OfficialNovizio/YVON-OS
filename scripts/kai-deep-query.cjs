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
  console.log('=== KAI DEEP QUERY ===');
  
  // Find which venture the competitors belong to
  console.log('\n--- competitors with venture slug ---');
  const { data: comps } = await supabase.from('competitors').select('*').limit(50);
  if (comps) {
    const ventureIds = [...new Set(comps.map(c => c.venture_id))];
    for (const vid of ventureIds) {
      const { data: v } = await supabase.from('ventures').select('slug, venture_name').eq('id', vid).single();
      console.log('venture_id ' + vid + ' -> ' + (v ? v.slug + ' (' + v.venture_name + ')' : 'NOT FOUND'));
    }
    for (const c of comps) {
      console.log('  ' + (c.brand_name || c.handle || c.name) + ' | ig_followers: ' + (c.ig_followers || 'N/A') + ' | created: ' + (c.created_at || 'N/A'));
    }
  }

  // Full competitor_snapshots query - no venture filter
  console.log('\n--- competitor_snapshots (ALL, no filter) ---');
  const { data: csAll, error: csErr } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .order('captured_at', { ascending: false })
    .limit(30);
  console.log('Total: ' + (csAll ? csAll.length : 0) + ' rows');
  if (csErr) console.log('ERROR: ' + csErr.message + ' | code: ' + csErr.code);
  if (csAll && csAll.length > 0) {
    for (const r of csAll) {
      console.log('  - vid: ' + r.venture_id + ' | platform: ' + r.platform + ' | url: ' + (r.competitor_url || 'N/A') + ' | captured: ' + r.captured_at);
    }
  }

  // Check agent_sessions with NO date filter
  console.log('\n--- agent_sessions (ALL, last 50) ---');
  const { data: sessAll } = await supabase
    .from('agent_sessions')
    .select('venture, agent_id, tokens_used, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  console.log('Total: ' + (sessAll ? sessAll.length : 0));
  if (sessAll && sessAll.length > 0) {
    const byDay = {};
    for (const r of sessAll) {
      const day = r.created_at.slice(0, 10);
      const v = r.venture || '?';
      if (!byDay[day]) byDay[day] = {};
      if (!byDay[day][v]) byDay[day][v] = 0;
      byDay[day][v]++;
    }
    for (const [day, byVenture] of Object.entries(byDay).sort()) {
      const parts = Object.entries(byVenture).map(([v, c]) => v + ':' + c).join(', ');
      console.log('  ' + day + ': ' + parts);
    }
  }

  // Check competitor_content table
  console.log('\n--- competitor_content ---');
  const { data: cc } = await supabase.from('competitor_content').select('*').limit(20);
  console.log('Total: ' + (cc ? cc.length : 0));
  if (cc && cc.length > 0) {
    for (const r of cc) {
      console.log('  - vid: ' + r.venture_id + ' | url: ' + (r.competitor_url || r.url || 'N/A') + ' | created: ' + (r.created_at || 'N/A'));
    }
  }

  // competitor_metrics
  console.log('\n--- competitor_metrics ---');
  const { data: cm } = await supabase.from('competitor_metrics').select('*').limit(20);
  console.log('Total: ' + (cm ? cm.length : 0));
  if (cm && cm.length > 0) {
    for (const r of cm) {
      console.log('  - ' + r.competitor_id + ' | ' + (r.metric_name || JSON.stringify(r).slice(0, 80)));
    }
  }

  // Check venture IDs
  console.log('\n--- ventures (full columns) ---');
  const { data: vFull } = await supabase.from('ventures').select('*');
  if (vFull) {
    for (const v of vFull) {
      console.log('  id: ' + v.id + ' | slug: ' + v.slug + ' | name: ' + (v.venture_name || v.name));
      console.log('    ig: ' + (v.instagram_handle || v.ig_handle || 'N/A'));
      console.log('    yt: ' + (v.youtube_channel || v.yt_channel || 'N/A'));
      console.log('    li: ' + (v.linkedin_url || v.li_url || 'N/A'));
      console.log('    ga4: ' + (v.ga4_property_id || 'N/A'));
      console.log('    website: ' + (v.website_url || 'N/A'));
      console.log('    founded: ' + (v.founded_year || 'N/A'));
      console.log('    tier: ' + (v.brand_tier || 'N/A'));
    }
  }

  // List ALL table names via pg_catalog
  console.log('\n--- all tables (public schema) ---');
  const { data: tables } = await supabase
    .from('pg_catalog.pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .order('tablename');
  if (tables) {
    for (const t of tables) {
      // Count rows
      const { count, error: countErr } = await supabase.from(t.tablename).select('*', { count: 'exact', head: true });
      if (!countErr) {
        console.log('  ' + t.tablename + ': ' + count + ' rows');
      } else {
        console.log('  ' + t.tablename + ': ERR');
      }
    }
  }
}

main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1) });
