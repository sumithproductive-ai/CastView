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
import { deriveRenderedContexts } from '../../lib/contextCodes';
import { clearPendingProspectConsent, readPendingProspectConsent } from '../../lib/prospectConsent';
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
  hair?: string;
  notes?: string;
  signed_status?: string;
  consent_at?: string | null;
  consent_by?: string | null;
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
    bust?: string | null;
    waist?: string | null;
    hips?: string | null;
    shoe?: string | null;
    hair?: string | null;
    notes?: string | null;
    signed_status?: string;
    consent_at?: string | null;
    consent_by?: string | null;
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
    renderedContexts: deriveRenderedContexts(digitalSets),
    division: '',
    primaryContext: '',
    markets: row.markets ?? [],
    height: row.height ?? '',
    hair: row.hair ?? '',
    notes: row.notes ?? '',
    signed_status: row.signed_status ?? 'pending',
    consent_at: row.consent_at ?? null,
    consent_by: row.consent_by ?? null,
    measurements: {
      chest: row.bust ?? '',
      waist: row.waist ?? '',
      hips: row.hips ?? '',
      shoe: row.shoe ?? '',
    },
    digitalSets,
  });

  const PROSPECT_LIST_COLUMNS_BASIC =
    'id, name, status, status_color, created_at, source, markets, height, signed_status';
  const PROSPECT_LIST_COLUMNS_FULL = `${PROSPECT_LIST_COLUMNS_BASIC}, bust, waist, hips, shoe, hair, notes, consent_at, consent_by`;

  const fetchProspectRows = async (resolvedAgencyId: string) => {
    const full = await supabase
      .from('prospects')
      .select(PROSPECT_LIST_COLUMNS_FULL)
      .eq('agency_id', resolvedAgencyId)
      .order('created_at', { ascending: false });

    if (!full.error) return full;

    if (full.error.message.includes('consent_') || full.error.message.includes('bust')) {
      return supabase
        .from('prospects')
        .select(PROSPECT_LIST_COLUMNS_BASIC)
        .eq('agency_id', resolvedAgencyId)
        .order('created_at', { ascending: false });
    }

    throw full.error;
  };

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

      const { pruneOrphanedEvaluations } = await import('../../lib/supabase');
      await pruneOrphanedEvaluations(
        savedSet.id,
        (ds.evaluations ?? []).map((evaluation) => evaluation.id),
      );
    }
  };

  const loadProspects = async () => {
    setLoading(true);
    try {
      // 1. Fetch prospects without profile images (avoids timeout from large base64 blobs)
      const { data: prospectsData, error } = await fetchProspectRows(agencyId);

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

      const pendingConsent = readPendingProspectConsent();
      const insertPayload: Record<string, unknown> = {
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
        bust: prospect.measurements?.chest ?? '',
        waist: prospect.measurements?.waist ?? '',
        hips: prospect.measurements?.hips ?? '',
        shoe: prospect.measurements?.shoe ?? '',
        hair: prospect.hair ?? '',
        notes: prospect.notes ?? '',
      };

      if (pendingConsent) {
        insertPayload.consent_at = pendingConsent.confirmedAt;
        insertPayload.consent_by = pendingConsent.agentUserId;
      }

      let insertResult = await supabase
        .from('prospects')
        .insert(insertPayload)
        .select()
        .single();

      if (
        insertResult.error &&
        (insertResult.error.message.includes('consent_') ||
          insertResult.error.message.includes('bust'))
      ) {
        const {
          bust: _bust,
          waist: _waist,
          hips: _hips,
          shoe: _shoe,
          hair: _hair,
          notes: _notes,
          consent_at: _consentAt,
          consent_by: _consentBy,
          ...basicPayload
        } = insertPayload;
        insertResult = await supabase
          .from('prospects')
          .insert(basicPayload)
          .select()
          .single();
      }

      const { data, error } = insertResult;
      if (error) throw error;
      clearPendingProspectConsent();

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
      if (prospectFields.hair !== undefined) prospectUpdate.hair = prospectFields.hair;
      if (prospectFields.notes !== undefined) prospectUpdate.notes = prospectFields.notes;
      if (prospectFields.measurements?.chest !== undefined) prospectUpdate.bust = prospectFields.measurements.chest;
      if (prospectFields.measurements?.waist !== undefined) prospectUpdate.waist = prospectFields.measurements.waist;
      if (prospectFields.measurements?.hips !== undefined) prospectUpdate.hips = prospectFields.measurements.hips;
      if (prospectFields.measurements?.shoe !== undefined) prospectUpdate.shoe = prospectFields.measurements.shoe;
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
        let updateResult = await supabase
          .from('prospects')
          .update(prospectUpdate)
          .eq('id', id);

        if (
          updateResult.error &&
          (updateResult.error.message.includes('consent_') ||
            updateResult.error.message.includes('bust') ||
            updateResult.error.message.includes('hair'))
        ) {
          const {
            bust: _bust,
            waist: _waist,
            hips: _hips,
            shoe: _shoe,
            hair: _hair,
            notes: _notes,
            consent_at: _consentAt,
            consent_by: _consentBy,
            ...basicUpdate
          } = prospectUpdate;
          updateResult = await supabase
            .from('prospects')
            .update(basicUpdate)
            .eq('id', id);
        }

        if (updateResult.error) throw updateResult.error;
      }

      if (digitalSets !== undefined) {
        // Instead of delete+reinsert, upsert each digital set and its evaluations
        await saveDigitalSets(id, digitalSets);
      }

      let reloadResult = await supabase
        .from('prospects')
        .select(`${PROSPECT_LIST_COLUMNS_FULL}, image`)
        .eq('id', id)
        .single();

      if (
        reloadResult.error &&
        (reloadResult.error.message.includes('consent_') ||
          reloadResult.error.message.includes('bust'))
      ) {
        reloadResult = await supabase
          .from('prospects')
          .select(`${PROSPECT_LIST_COLUMNS_BASIC}, image`)
          .eq('id', id)
          .single();
      }

      const { data } = reloadResult;

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
