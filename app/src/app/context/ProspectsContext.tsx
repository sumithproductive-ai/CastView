import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { DigitalSet } from '../types/talent';
import { supabase, storagePathForPersist, uploadDigitalImage } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export type Prospect = {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  evaluations: number;
  submissionDate: string;
  source?: string;
  email?: string;
  image: string | null;
  contexts: string[];
  renderedContexts: string[];
  division?: string;
  primaryContext?: string;
  markets?: string[];
  height?: string;
  signed_status?: string;
  measurements?: {
    chest: string;
    waist: string;
    hips: string;
    shoe: string;
  };
  digitalSets: DigitalSet[];
};

type ProspectsContextType = {
  prospects: Prospect[];
  loading: boolean;
  addProspect: (prospect: Prospect) => void;
  updateProspect: (id: string, updates: Partial<Prospect>) => void;
  removeProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
};

const ProspectsContext = createContext<ProspectsContextType | undefined>(undefined);
// loading is now exposed in context value

export function ProspectsProvider({ children }: { children: ReactNode }) {
  const { agencyId } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const mapEvaluationsForSet = (evals: Array<{
    id: string;
    completed_at?: string;
    agent_notes?: string;
    context_evaluations?: Array<{
      context: string;
      alignment_score: number;
      fit_label: string;
      reasoning: string;
      strengths?: string[];
      risks?: string[];
      market_signals?: string[];
      suggested_next_steps?: string[];
    }>;
  }>) =>
    evals.map(ev => ({
      id: ev.id,
      completedAt: ev.completed_at ?? '',
      agentNotes: ev.agent_notes ?? '',
      contexts: (ev.context_evaluations ?? []).map((ce) => ({
        context: ce.context,
        alignmentScore: ce.alignment_score,
        fitLabel: ce.fit_label,
        reasoning: ce.reasoning,
        strengths: ce.strengths ?? [],
        risks: ce.risks ?? [],
        marketSignals: ce.market_signals ?? [],
        suggestedNextSteps: ce.suggested_next_steps ?? [],
      })),
    }));

  const mapDigitalSetRows = (
    sets: Array<{
      id: string;
      title?: string;
      uploaded_at?: string;
      front?: string | null;
      profile?: string | null;
      three_quarter?: string | null;
      full_body?: string | null;
      notes?: string;
      tags?: string[];
    }>,
    evalsBySetId: Record<string, Parameters<typeof mapEvaluationsForSet>[0]>,
  ): DigitalSet[] =>
    sets.map(ds => ({
      id: ds.id,
      title: ds.title ?? '',
      uploadedAt: ds.uploaded_at ?? '',
      front: ds.front ?? null,
      profile: ds.profile ?? null,
      threeQuarter: ds.three_quarter ?? null,
      fullBody: ds.full_body ?? null,
      additionalImages: [],
      notes: ds.notes ?? '',
      tags: ds.tags ?? [],
      evaluations: mapEvaluationsForSet(evalsBySetId[ds.id] ?? []),
    }));

  const mapProspect = (row: {
    id: string;
    name: string;
    status?: string;
    status_color?: string;
    created_at: string;
    source?: string;
    email?: string;
    image?: string | null;
    markets?: string[];
    height?: string;
    signed_status?: string;
  }, digitalSets: DigitalSet[]): Prospect => ({
    id: row.id,
    name: row.name,
    status: row.status ?? 'DRAFT',
    statusColor: row.status_color ?? '#888880',
    evaluations: digitalSets.reduce((sum, ds) => sum + (ds.evaluations?.length ?? 0), 0),
    submissionDate: new Date(row.created_at).toLocaleDateString(),
    source: row.source ?? '',
    email: row.email ?? '',
    image: row.image ?? null,
    contexts: row.markets ?? [],
    renderedContexts: [],
    division: '',
    primaryContext: '',
    markets: row.markets ?? [],
    height: row.height ?? '',
    signed_status: row.signed_status ?? 'pending',
    measurements: { chest: '', waist: '', hips: '', shoe: '' },
    digitalSets,
  });

  const PROSPECT_LIST_COLUMNS =
    'id, name, status, status_color, created_at, source, markets, height, signed_status';

  const fetchEvaluationsForSetIds = async (setIds: string[]) => {
    if (setIds.length === 0) return [];

    const { data: evalRows, error: evalError } = await supabase
      .from('evaluations')
      .select('id, digital_set_id, completed_at, agent_notes, entity_id, created_at')
      .in('digital_set_id', setIds)
      .order('created_at', { ascending: false });

    if (evalError) throw evalError;
    if (!evalRows?.length) return [];

    const evalIds = evalRows.map((e) => e.id);
    const { data: contextRows, error: ctxError } = await supabase
      .from('context_evaluations')
      .select('*')
      .in('evaluation_id', evalIds);

    if (ctxError) throw ctxError;

    const contextsByEvalId: Record<string, NonNullable<typeof contextRows>> = {};
    for (const row of contextRows ?? []) {
      if (!contextsByEvalId[row.evaluation_id]) contextsByEvalId[row.evaluation_id] = [];
      contextsByEvalId[row.evaluation_id]!.push(row);
    }

    return evalRows.map((ev) => ({
      ...ev,
      context_evaluations: contextsByEvalId[ev.id] ?? [],
    }));
  };

  const hydrateProspectImages = async (prospectIds: string[]) => {
    for (const id of prospectIds) {
      const { data, error } = await supabase
        .from('prospects')
        .select('image')
        .eq('id', id)
        .maybeSingle();

      if (error || !data?.image || data.image.startsWith('data:')) continue;

      setProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, image: data.image } : p)),
      );
    }
  };

  const fetchDigitalSetsForProspectIds = async (prospectIds: string[]) => {
    const batchSize = 15;
    const allSets: Array<{
      id: string;
      entity_id: string;
      title?: string;
      uploaded_at?: string;
      front?: string | null;
      profile?: string | null;
      three_quarter?: string | null;
      full_body?: string | null;
      notes?: string;
      tags?: string[];
    }> = [];

    for (let i = 0; i < prospectIds.length; i += batchSize) {
      const batch = prospectIds.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('digital_sets')
        .select(
          'id, entity_id, title, uploaded_at, front, profile, three_quarter, full_body, notes, tags',
        )
        .in('entity_id', batch)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data?.length) allSets.push(...data);
    }

    return allSets;
  };

  const toCompletedAtForDb = (value: string): string => {
    if (!value) return new Date().toISOString();
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
    return new Date().toISOString();
  };

  const saveDigitalSets = async (entityId: string, digitalSets: DigitalSet[]) => {
    const uploadIfBase64 = async (value: string | null | undefined, path: string): Promise<string | null> => {
      if (!value) return null;
      if (value.startsWith('data:')) {
        return uploadDigitalImage(value, path);
      }
      return storagePathForPersist(value);
    };

    for (const ds of digitalSets) {
      const basePath = `prospects/${entityId}/${ds.id}`;
      const front = await uploadIfBase64(ds.front, `${basePath}/front`);
      const profile = await uploadIfBase64(ds.profile, `${basePath}/profile`);
      const threeQuarter = await uploadIfBase64(ds.threeQuarter, `${basePath}/three_quarter`);
      const fullBody = await uploadIfBase64(ds.fullBody, `${basePath}/full_body`);

      const { data: savedSet, error } = await supabase
        .from('digital_sets')
        .upsert({
          id: ds.id,
          entity_id: entityId,
          entity_type: 'prospect',
          agency_id: agencyId,
          title: ds.title,
          uploaded_at: ds.uploadedAt,
          front,
          profile,
          three_quarter: threeQuarter,
          full_body: fullBody,
          notes: ds.notes,
          tags: ds.tags,
        })
        .select()
        .single();

      if (error || !savedSet) {
        console.error('[CastView] saveDigitalSets upsert error:', error);
        if ((ds.evaluations ?? []).length > 0) {
          throw error ?? new Error('Failed to save digital set before evaluation');
        }
        continue;
      }

      for (const ev of (ds.evaluations ?? [])) {
        const { data: savedEval, error: evalError } = await supabase
          .from('evaluations')
          .upsert({
            id: ev.id,
            digital_set_id: savedSet.id,
            entity_id: entityId,
            agency_id: agencyId,
            completed_at: toCompletedAtForDb(ev.completedAt),
            agent_notes: ev.agentNotes ?? '',
          })
          .select()
          .single();

        if (evalError || !savedEval) {
          console.error('[CastView] evaluation upsert error:', evalError);
          throw evalError ?? new Error('Failed to save evaluation');
        }

        for (const ctx of ev.contexts) {
          const { error: ctxError } = await supabase
            .from('context_evaluations')
            .upsert({
              evaluation_id: savedEval.id,
              context: ctx.context,
              alignment_score: ctx.alignmentScore,
              fit_label: ctx.fitLabel,
              reasoning: ctx.reasoning,
              strengths: ctx.strengths,
              risks: ctx.risks,
              market_signals: ctx.marketSignals,
              suggested_next_steps: ctx.suggestedNextSteps,
            });

          if (ctxError) {
            console.error('[CastView] context_evaluation upsert error:', ctxError);
            throw ctxError;
          }
        }
      }
    }
  };

  const loadProspects = async () => {
    setLoading(true);
    try {
      // 1. Fetch prospects without profile images (avoids timeout from large base64 blobs)
      const { data: prospectsData, error } = await supabase
        .from('prospects')
        .select(PROSPECT_LIST_COLUMNS)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!prospectsData || prospectsData.length === 0) {
        setProspects([]);
        return;
      }

      const prospectIds = prospectsData.map((p) => p.id);

      // 2. Fetch digital sets in batches
      const allSets = await fetchDigitalSetsForProspectIds(prospectIds);

      const setIds = allSets.map((s) => s.id);

      // 3. Fetch evaluations + context rows (split queries — faster than nested join)
      const allEvals = await fetchEvaluationsForSetIds(setIds);

      // Group evaluations by digital_set_id
      const evalsBySetId: Record<string, NonNullable<typeof allEvals>> = {};
      for (const ev of (allEvals ?? [])) {
        if (!evalsBySetId[ev.digital_set_id]) evalsBySetId[ev.digital_set_id] = [];
        evalsBySetId[ev.digital_set_id]!.push(ev);
      }

      // Group digital sets by entity_id
      const setsByProspectId: Record<string, DigitalSet[]> = {};
      for (const ds of allSets) {
        if (!setsByProspectId[ds.entity_id]) setsByProspectId[ds.entity_id] = [];
        const evals = (evalsBySetId[ds.id] ?? []).map(ev => ({
          id: ev.id,
          completedAt: ev.completed_at ?? '',
          agentNotes: ev.agent_notes ?? '',
          contexts: (ev.context_evaluations ?? []).map((ce: {
            context: string;
            alignment_score: number;
            fit_label: string;
            reasoning: string;
            strengths?: string[];
            risks?: string[];
            market_signals?: string[];
            suggested_next_steps?: string[];
          }) => ({
            context: ce.context,
            alignmentScore: ce.alignment_score,
            fitLabel: ce.fit_label,
            reasoning: ce.reasoning,
            strengths: ce.strengths ?? [],
            risks: ce.risks ?? [],
            marketSignals: ce.market_signals ?? [],
            suggestedNextSteps: ce.suggested_next_steps ?? [],
          })),
        }));

        setsByProspectId[ds.entity_id]!.push({
          id: ds.id,
          title: ds.title ?? '',
          uploadedAt: ds.uploaded_at ?? '',
          front: ds.front ?? null,
          profile: ds.profile ?? null,
          threeQuarter: ds.three_quarter ?? null,
          fullBody: ds.full_body ?? null,
          additionalImages: [],
          notes: ds.notes ?? '',
          tags: ds.tags ?? [],
          evaluations: evals,
        });
      }

      // Assemble final prospects
      const assembled = prospectsData.map((p) =>
        mapProspect({ ...p, image: null }, setsByProspectId[p.id] ?? []),
      );

      setProspects(assembled);
      void hydrateProspectImages(prospectIds);
    } catch (err) {
      console.error('[ProspectsContext] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!agencyId) {
      const timer = setTimeout(() => {
        if (!agencyId) {
          setProspects([]);
          setLoading(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
    loadProspects();
  }, [agencyId]);

  const addProspect = useCallback(async (prospect: Prospect) => {
    if (!agencyId) return;
    try {
      // Upload profile image to storage if it's base64
      let profileImageUrl = prospect.image;
      if (profileImageUrl && profileImageUrl.startsWith('data:')) {
        profileImageUrl = await uploadDigitalImage(
          profileImageUrl,
          `prospects/${prospect.id}/profile_image`
        );
      } else if (profileImageUrl) {
        profileImageUrl = storagePathForPersist(profileImageUrl) ?? profileImageUrl;
      }

      const { data, error } = await supabase
        .from('prospects')
        .insert({
          id: prospect.id,
          agency_id: agencyId,
          name: prospect.name,
          status: prospect.status,
          status_color: prospect.statusColor,
          source: prospect.source ?? '',
          height: prospect.height ?? '',
          markets: prospect.markets ?? [],
          email: prospect.email ?? '',
          image: profileImageUrl ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (prospect.digitalSets?.length > 0) {
        await saveDigitalSets(prospect.id, prospect.digitalSets);
      }

      const { data: freshSets } = await supabase
        .from('digital_sets')
        .select('*')
        .eq('entity_id', prospect.id)
        .order('created_at', { ascending: false });

      const setIds = (freshSets ?? []).map(s => s.id);
      const { data: allEvals } = setIds.length > 0
        ? await supabase
            .from('evaluations')
            .select('*, context_evaluations(*)')
            .in('digital_set_id', setIds)
            .order('created_at', { ascending: false })
        : { data: [] };

      const evalsBySetId: Record<string, NonNullable<typeof allEvals>> = {};
      for (const ev of (allEvals ?? [])) {
        if (!evalsBySetId[ev.digital_set_id]) evalsBySetId[ev.digital_set_id] = [];
        evalsBySetId[ev.digital_set_id]!.push(ev);
      }

      const digitalSets = mapDigitalSetRows(freshSets ?? [], evalsBySetId);
      const newProspect = mapProspect(data, digitalSets);
      setProspects(prev => [newProspect, ...prev]);

      try {
        await supabase.from('events').insert({
          agency_id: agencyId,
          event_type: 'prospect_added',
          metadata: { prospectId: data.id, name: data.name },
        });
      } catch { /* non-critical, ignore */ }
    } catch (err) {
      console.error('[ProspectsContext] addProspect error:', err);
    }
  }, [agencyId]);

  const updateProspect = useCallback(async (id: string, updates: Partial<Prospect>) => {
    if (!agencyId) return;
    try {
      const { digitalSets, ...prospectFields } = updates;

      // Only update prospect row fields that are actually provided
      const prospectUpdate: Record<string, unknown> = {};
      if (prospectFields.name !== undefined) prospectUpdate.name = prospectFields.name;
      if (prospectFields.status !== undefined) prospectUpdate.status = prospectFields.status;
      if (prospectFields.statusColor !== undefined) prospectUpdate.status_color = prospectFields.statusColor;
      if (prospectFields.source !== undefined) prospectUpdate.source = prospectFields.source;
      if (prospectFields.height !== undefined) prospectUpdate.height = prospectFields.height;
      if (prospectFields.signed_status !== undefined) prospectUpdate.signed_status = prospectFields.signed_status;
      if (prospectFields.markets !== undefined) prospectUpdate.markets = prospectFields.markets;
      if (prospectFields.image !== undefined) {
        let imageToSave = prospectFields.image;
        if (imageToSave && imageToSave.startsWith('data:')) {
          imageToSave = await uploadDigitalImage(imageToSave, `prospects/${id}/profile_image`) ?? imageToSave;
        } else if (imageToSave) {
          imageToSave = storagePathForPersist(imageToSave) ?? imageToSave;
        }
        prospectUpdate.image = imageToSave;
      }

      if (Object.keys(prospectUpdate).length > 0) {
        const { error } = await supabase
          .from('prospects')
          .update(prospectUpdate)
          .eq('id', id);
        if (error) throw error;
      }

      if (digitalSets !== undefined) {
        // Instead of delete+reinsert, upsert each digital set and its evaluations
        await saveDigitalSets(id, digitalSets);
      }

      // Reload fresh state from Supabase (single prospect — safe to include image)
      const { data } = await supabase
        .from('prospects')
        .select(`${PROSPECT_LIST_COLUMNS}, image`)
        .eq('id', id)
        .single();

      if (data) {
        const { data: freshSets } = await supabase
          .from('digital_sets')
          .select(
            'id, entity_id, title, uploaded_at, front, profile, three_quarter, full_body, notes, tags',
          )
          .eq('entity_id', id)
          .order('created_at', { ascending: false });

        const setIds = (freshSets ?? []).map((s: { id: string }) => s.id);
        const allEvals = await fetchEvaluationsForSetIds(setIds);

        const evalsBySetId: Record<string, NonNullable<typeof allEvals>> = {};
        for (const ev of (allEvals ?? [])) {
          if (!evalsBySetId[ev.digital_set_id]) evalsBySetId[ev.digital_set_id] = [];
          evalsBySetId[ev.digital_set_id]!.push(ev);
        }

        const mappedSets = mapDigitalSetRows(freshSets ?? [], evalsBySetId);
        const updated = mapProspect(data, mappedSets);
        setProspects(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error('[ProspectsContext] updateProspect error:', err);
      throw err;
    }
  }, [agencyId]);

  const removeProspect = useCallback(async (id: string) => {
    if (!agencyId) return;
    try {
      await supabase.from('prospects').delete().eq('id', id);
      setProspects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('[ProspectsContext] removeProspect error:', err);
    }
  }, [agencyId]);

  const getProspectById = useCallback(
    (id: string) => prospects.find(p => p.id === id),
    [prospects]
  );

  const value = useMemo(
    () => ({
      prospects,
      loading,
      addProspect,
      updateProspect,
      removeProspect,
      getProspectById,
    }),
    [prospects, loading, addProspect, updateProspect, removeProspect, getProspectById]
  );

  return (
    <ProspectsContext.Provider value={value}>
      {children}
    </ProspectsContext.Provider>
  );
}

export function useProspects() {
  const context = useContext(ProspectsContext);
  if (!context) {
    throw new Error('useProspects must be used within ProspectsProvider');
  }
  return context;
}
