import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import sumithThumbnail from '@/assets/sumith-thumbnail.jpg';
import { SUMITH_DIGITAL_SET_V1 } from '../constants/sumithProspect';
import type { DigitalSet } from '../types/talent';
import { supabase, uploadDigitalImage } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export type Prospect = {
  id: string;
  name: string;
  status: string;
  statusColor: string;
  evaluations: number;
  submissionDate: string;
  source?: string;
  image: string | null;
  contexts: string[];
  renderedContexts: string[];
  division?: string;
  primaryContext?: string;
  markets?: string[];
  height?: string;
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
  addProspect: (prospect: Prospect) => void;
  updateProspect: (id: string, updates: Partial<Prospect>) => void;
  removeProspect: (id: string) => void;
  getProspectById: (id: string) => Prospect | undefined;
};

const ProspectsContext = createContext<ProspectsContextType | undefined>(undefined);

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
    image?: string | null;
    markets?: string[];
    height?: string;
  }, digitalSets: DigitalSet[]): Prospect => ({
    id: row.id,
    name: row.name,
    status: row.status ?? 'DRAFT',
    statusColor: row.status_color ?? '#888880',
    evaluations: digitalSets.reduce((sum, ds) => sum + (ds.evaluations?.length ?? 0), 0),
    submissionDate: new Date(row.created_at).toLocaleDateString(),
    source: row.source ?? '',
    image: row.image ?? null,
    contexts: row.markets ?? [],
    renderedContexts: [],
    division: '',
    primaryContext: '',
    markets: row.markets ?? [],
    height: row.height ?? '',
    measurements: { chest: '', waist: '', hips: '', shoe: '' },
    digitalSets,
  });

  const saveDigitalSets = async (entityId: string, digitalSets: DigitalSet[]) => {
    const uploadIfBase64 = async (value: string | null | undefined, path: string): Promise<string | null> => {
      if (!value) return null;
      if (value.startsWith('data:')) {
        const url = await uploadDigitalImage(value, path);
        return url;
      }
      return value;
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
            completed_at: ev.completedAt,
            agent_notes: ev.agentNotes ?? '',
          })
          .select()
          .single();

        if (evalError || !savedEval) continue;

        for (const ctx of ev.contexts) {
          await supabase
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
        }
      }
    }
  };

  const loadProspects = async () => {
    setLoading(true);
    try {
      // 1. Fetch all prospects
      const { data: prospectsData, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!prospectsData || prospectsData.length === 0) {
        setProspects([]);
        return;
      }

      const prospectIds = prospectsData.map(p => p.id);

      // 2. Fetch all digital sets for all prospects in one query
      const { data: allSets } = await supabase
        .from('digital_sets')
        .select('*')
        .in('entity_id', prospectIds)
        .order('created_at', { ascending: false });

      const setIds = (allSets ?? []).map(s => s.id);

      // 3. Fetch all evaluations + context_evaluations for all sets in one query
      const { data: allEvals } = setIds.length > 0
        ? await supabase
            .from('evaluations')
            .select('*, context_evaluations(*)')
            .in('digital_set_id', setIds)
            .order('created_at', { ascending: false })
        : { data: [] };

      // Group evaluations by digital_set_id
      const evalsBySetId: Record<string, NonNullable<typeof allEvals>> = {};
      for (const ev of (allEvals ?? [])) {
        if (!evalsBySetId[ev.digital_set_id]) evalsBySetId[ev.digital_set_id] = [];
        evalsBySetId[ev.digital_set_id]!.push(ev);
      }

      // Group digital sets by entity_id
      const setsByProspectId: Record<string, DigitalSet[]> = {};
      for (const ds of (allSets ?? [])) {
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
      const assembled = prospectsData.map(p =>
        mapProspect(p, setsByProspectId[p.id] ?? [])
      );

      setProspects(assembled);
    } catch (err) {
      console.error('[ProspectsContext] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!agencyId) {
      setProspects([]);
      setLoading(false);
      return;
    }
    loadProspects();
  }, [agencyId]);

  const addProspect = useCallback(async (prospect: Prospect) => {
    if (!agencyId) return;
    try {
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
          image: prospect.image ?? null,
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
    } catch (err) {
      console.error('[ProspectsContext] addProspect error:', err);
    }
  }, [agencyId]);

  const updateProspect = useCallback(async (id: string, updates: Partial<Prospect>) => {
    if (!agencyId) return;
    try {
      const { digitalSets, ...prospectFields } = updates;

      if (Object.keys(prospectFields).length > 0) {
        const { error } = await supabase
          .from('prospects')
          .update({
            name: prospectFields.name,
            status: prospectFields.status,
            status_color: prospectFields.statusColor,
            source: prospectFields.source,
            height: prospectFields.height,
            markets: prospectFields.markets,
            image: prospectFields.image,
          })
          .eq('id', id);

        if (error) throw error;
      }

      if (digitalSets !== undefined) {
        await supabase
          .from('digital_sets')
          .delete()
          .eq('entity_id', id);

        if (digitalSets.length > 0) {
          await saveDigitalSets(id, digitalSets);
        }
      }

      const { data } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        const { data: freshSets } = await supabase
          .from('digital_sets')
          .select('*')
          .eq('entity_id', id)
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

        const mappedSets = mapDigitalSetRows(freshSets ?? [], evalsBySetId);
        const updated = mapProspect(data, mappedSets);
        setProspects(prev => prev.map(p => p.id === id ? updated : p));
      }
    } catch (err) {
      console.error('[ProspectsContext] updateProspect error:', err);
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
      addProspect,
      updateProspect,
      removeProspect,
      getProspectById,
    }),
    [prospects, addProspect, updateProspect, removeProspect, getProspectById]
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
