import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== KAI ANALYST — DATABASE DUMP ===\n");
  console.log(`Connected to: ${supabaseUrl}\n`);

  // 1. social_snapshots — ventures novizio, hourbour; cache still fresh
  console.log("--- social_snapshots (novizio + hourbour, cache_expires_at > now) ---");
  const { data: snapshots, error: sErr } = await supabase
    .from('social_snapshots')
    .select('*')
    .in('venture_slug', ['novizio', 'hourbour'])
    .gt('cache_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (sErr) {
    console.log(`ERROR: ${sErr.message}`);
  } else if (!snapshots || snapshots.length === 0) {
    console.log("No fresh snapshots found.");
  } else {
    console.log(`Found ${snapshots.length} snapshot(s):`);
    for (const r of snapshots) {
      console.log(JSON.stringify(r, null, 2));
    }
  }

  // 2. social_posts — ventures novizio, hourbour; most recent 20
  console.log("\n--- social_posts (novizio + hourbour, latest 20) ---");
  const { data: posts, error: pErr } = await supabase
    .from('social_posts')
    .select('*')
    .in('venture_slug', ['novizio', 'hourbour'])
    .order('published_at', { ascending: false })
    .limit(20);

  if (pErr) {
    console.log(`ERROR: ${pErr.message}`);
  } else if (!posts || posts.length === 0) {
    console.log("No posts found.");
  } else {
    console.log(`Found ${posts.length} post(s):`);
    for (const r of posts) {
      console.log(JSON.stringify(r, null, 2));
    }
  }

  // 3. competitors
  console.log("\n--- competitors (all rows) ---");
  const { data: competitors, error: cErr } = await supabase
    .from('competitors')
    .select('*');

  if (cErr) {
    console.log(`ERROR: ${cErr.message}`);
  } else if (!competitors || competitors.length === 0) {
    console.log("No competitors found.");
  } else {
    console.log(`Found ${competitors.length} competitor(s):`);
    for (const r of competitors) {
      console.log(JSON.stringify(r, null, 2));
    }
  }
}

main().catch(e => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
