import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== KAI ANALYST — DIAGNOSTIC PASS ===\n");

  // 1. Check social_snapshots columns
  console.log("--- social_snapshots: COLUMN CHECK ---");
  const { data: snapCol } = await supabase
    .from('social_snapshots')
    .select('*')
    .limit(1);
  if (snapCol && snapCol.length > 0) {
    console.log("Columns:", Object.keys(snapCol[0]).join(", "));
    console.log("Sample:", JSON.stringify(snapCol[0], null, 2));
  } else {
    console.log("No rows in social_snapshots at all.");
  }

  // 2. Try the query with correct columns (drop order by if created_at doesn't exist)
  console.log("\n--- social_snapshots: fresh for novizio + hourbour ---");
  const { data: snap, error: sErr } = await supabase
    .from('social_snapshots')
    .select('*')
    .in('venture_slug', ['novizio', 'hourbour'])
    .gt('cache_expires_at', new Date().toISOString());

  if (sErr) {
    console.log(`ERROR: ${sErr.message}`);
    console.log("Hint:", sErr.hint);
  } else {
    console.log(`Found ${snap?.length ?? 0} fresh snapshot(s).`);
    if (snap) for (const r of snap) console.log(JSON.stringify(r, null, 2));
  }

  // 3. Also check all social_snapshots regardless of freshness
  console.log("\n--- social_snapshots: ALL rows (both ventures) ---");
  const { data: allSnap } = await supabase
    .from('social_snapshots')
    .select('*')
    .in('venture_slug', ['novizio', 'hourbour']);
  if (allSnap && allSnap.length > 0) {
    console.log(`Found ${allSnap.length} total snapshot(s):`);
    for (const r of allSnap) console.log(JSON.stringify(r, null, 2));
  } else {
    console.log("No snapshots at all for these ventures.");
  }

  // 4. Check ventures table for IDs
  console.log("\n--- ventures table ---");
  const { data: ventures } = await supabase.from('ventures').select('*');
  if (ventures) {
    for (const v of ventures) console.log(JSON.stringify(v, null, 2));
  }

  // 5. social_posts for Hourbour specifically
  console.log("\n--- social_posts: Hourbour only ---");
  const { data: hbPosts } = await supabase
    .from('social_posts')
    .select('*')
    .eq('venture_slug', 'hourbour')
    .order('published_at', { ascending: false })
    .limit(20);
  if (hbPosts && hbPosts.length > 0) {
    for (const r of hbPosts) console.log(JSON.stringify(r, null, 2));
  } else {
    console.log("No Hourbour posts found.");
  }

  // 6. Check total row counts
  console.log("\n--- ROW COUNTS ---");
  for (const table of ['social_snapshots', 'social_posts', 'competitors', 'ventures']) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${error ? 'ERR: ' + error.message : count}`);
  }
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
