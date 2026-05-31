import { supabase } from './supabase';

export async function castviewDiagnose() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  console.group('[CastView] Supabase diagnose');

  console.log('1. Env vars');
  console.log('   VITE_SUPABASE_URL:', url ? `${url.slice(0, 30)}...` : '❌ MISSING');
  console.log('   VITE_SUPABASE_ANON_KEY:', key ? `set (${key.length} chars)` : '❌ MISSING');

  if (!url || !key) {
    console.error('   → Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to app/.env.local, then restart dev server.');
    console.groupEnd();
    return { ok: false, reason: 'missing_env' };
  }

  console.log('2. Auth session');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('   ❌ getSession error:', sessionError.message);
  } else {
    const user = sessionData.session?.user;
    console.log('   user:', user ? user.email : '❌ not logged in');
    console.log('   user id:', user?.id ?? '—');
  }

  const userId = sessionData.session?.user?.id;
  let agencyId: string | null = null;

  if (userId) {
    console.log('3. Profile / agency_id');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('   ❌ profiles query:', profileError.message, profileError);
    } else {
      agencyId = profile?.agency_id ?? null;
      console.log('   agency_id:', agencyId ?? '❌ NULL — prospects cannot save or load');
    }
  } else {
    console.warn('3. Skipped profile check (no session)');
  }

  if (agencyId) {
    console.log('4. Prospects read');
    const { data: prospects, error: prospectsError, count } = await supabase
      .from('prospects')
      .select('id, name, status, created_at', { count: 'exact' })
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (prospectsError) {
      console.error('   ❌ prospects query:', prospectsError.message, prospectsError);
    } else {
      console.log(`   ✅ ${count ?? prospects?.length ?? 0} prospect(s) for this agency`);
      console.table(prospects ?? []);
    }

    console.log('5. Write test (insert + delete)');
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase.from('prospects').insert({
      id: testId,
      agency_id: agencyId,
      name: '__castview_diagnose_test__',
      status: 'DRAFT',
      status_color: '#888880',
      source: 'TEST',
      height: '',
      markets: [],
      image: null,
    });

    if (insertError) {
      console.error('   ❌ insert failed:', insertError.message, insertError);
      console.error('   → Check RLS policies on prospects table.');
    } else {
      console.log('   ✅ insert ok');
      const { error: deleteError } = await supabase.from('prospects').delete().eq('id', testId);
      if (deleteError) {
        console.warn('   ⚠ delete test row failed:', deleteError.message);
      } else {
        console.log('   ✅ delete ok (test row removed)');
      }
    }
  } else if (userId) {
    console.warn('4–5. Skipped prospects tests (no agency_id)');
  }

  if (agencyId) {
    console.log('6. Evaluation write test (insert + delete)');
    const { data: sampleSet, error: sampleSetError } = await supabase
      .from('digital_sets')
      .select('id, entity_id')
      .eq('agency_id', agencyId)
      .limit(1)
      .maybeSingle();

    if (sampleSetError || !sampleSet) {
      console.warn('   ⚠ skipped — no digital set to attach test evaluation:', sampleSetError?.message ?? 'none found');
    } else {
      const testEvalId = crypto.randomUUID();
      const { error: evalInsertError } = await supabase.from('evaluations').insert({
        id: testEvalId,
        agency_id: agencyId,
        entity_id: sampleSet.entity_id,
        digital_set_id: sampleSet.id,
        completed_at: new Date().toISOString(),
        agent_notes: '__castview_diagnose_test__',
      });

      if (evalInsertError) {
        console.error('   ❌ evaluations insert:', evalInsertError.message, evalInsertError);
      } else {
        console.log('   ✅ evaluations insert ok');
        const { error: ctxInsertError } = await supabase.from('context_evaluations').insert({
          evaluation_id: testEvalId,
          context: '__test__',
          alignment_score: 80,
          fit_label: 'Test',
          reasoning: 'diagnose',
          strengths: [],
          risks: [],
          market_signals: [],
          suggested_next_steps: [],
        });

        if (ctxInsertError) {
          console.error('   ❌ context_evaluations insert:', ctxInsertError.message, ctxInsertError);
        } else {
          console.log('   ✅ context_evaluations insert ok');
        }

        await supabase.from('context_evaluations').delete().eq('evaluation_id', testEvalId);
        await supabase.from('evaluations').delete().eq('id', testEvalId);
        console.log('   ✅ evaluation test row removed');
      }
    }
  }

  console.log('7. Storage bucket "digitals"');
  const { data: bucketFiles, error: bucketAccessError } = await supabase.storage
    .from('digitals')
    .list('', { limit: 1 });

  if (bucketAccessError) {
    console.error('   ❌ digitals bucket access:', bucketAccessError.message, bucketAccessError);
    console.error('   → Create a public bucket named "digitals" (lowercase) with upload policy for authenticated users.');
  } else {
    console.log('   ✅ digitals bucket accessible');
    if (bucketFiles?.length) {
      console.log(`   (${bucketFiles.length}+ object(s) visible at root)`);
    }
  }

  console.groupEnd();
  return {
    ok: Boolean(url && key && userId && agencyId),
    url: Boolean(url),
    key: Boolean(key),
    userId: userId ?? null,
    agencyId,
  };
}

declare global {
  interface Window {
    castviewDiagnose?: typeof castviewDiagnose;
  }
}

export function attachCastviewDebug() {
  if (import.meta.env.DEV) {
    window.castviewDiagnose = castviewDiagnose;
    console.info('[CastView] Dev debug ready — run: await castviewDiagnose()');
  }
}
