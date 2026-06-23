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
  // Get full table listing
  const { data: tables } = await supabase
    .rpc('get_tables')  // try RPC
    .select('*');
  
  if (!tables) {
    // Fallback: query information_schema
    const { data: isTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');
    if (isTables) {
      for (const t of isTables) {
        const { count } = await supabase.from(t.table_name).select('*', { count: 'exact', head: true });
        console.log(t.table_name + ': ' + (count ?? '?') + ' rows');
      }
    }
  }
}
main().catch(e => console.error(e.message));
