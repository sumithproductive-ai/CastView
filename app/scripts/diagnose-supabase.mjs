import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function loadEnv() {
  const vars = {};
  if (!existsSync(envPath)) {
    console.warn('No .env.local found at', envPath);
    return vars;
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

const env = { ...process.env, ...loadEnv() };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('\n[CastView] Supabase diagnose (local Node script)\n');

console.log('1. Env vars');
console.log('   VITE_SUPABASE_URL:', url ? `${String(url).slice(0, 40)}...` : '❌ MISSING');
console.log('   VITE_SUPABASE_ANON_KEY:', key ? `set (${String(key).length} chars)` : '❌ MISSING');

if (!url || !key) {
  console.error('\n→ Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to app/.env.local\n');
  process.exit(1);
}

const supabase = createClient(url, key);

console.log('\n2. Auth session');
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.error('   ❌', sessionError.message);
} else {
  const user = sessionData.session?.user;
  console.log('   user:', user?.email ?? '❌ not logged in (Node has no browser session)');
  console.log('   user id:', user?.id ?? '—');
}

console.log('\n3. REST reachability (prospects table, anon)');
const { data, error, count } = await supabase
  .from('prospects')
  .select('id', { count: 'exact', head: true });

if (error) {
  console.error('   ❌', error.message, error);
} else {
  console.log(`   ✅ Connected — prospects table reachable (count hint: ${count ?? 'n/a'})`);
}

console.log('\n4. Storage buckets (may fail without auth)');
const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
if (bucketError) {
  console.warn('   ⚠', bucketError.message);
} else {
  const digitals = buckets?.find((b) => b.name === 'digitals');
  console.log('   digitals bucket:', digitals ? '✅ found' : '❌ not found');
}

console.log('\nDone. For full test (profile agency_id, insert), run in browser console while logged in:');
console.log('   await castviewDiagnose()\n');
