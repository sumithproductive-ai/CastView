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
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';

export type RosterModel = {
  id: string;
  name: string;
  image: string | null;
  primaryContext: string;
  contexts: string[];
  renderedContexts: string[];
  topScore: number;
  lastEvaluation: string;
  status: string;
  recentlySigned: boolean;
  division: string;
  digitalSets: DigitalSet[];
};

type RosterContextType = {
  models: RosterModel[];
  addModel: (model: RosterModel) => void;
  updateModel: (id: string, updates: Partial<RosterModel>) => void;
  removeModel: (id: string) => void;
  getModelById: (id: string) => RosterModel | undefined;
};

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export function RosterProvider({ children }: { children: ReactNode }) {
  const { agencyId } = useAuth();
  const [models, setModels] = useState<RosterModel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDigitalSets = async (entityId: string): Promise<DigitalSet[]> => {
    const { data: sets } = await supabase
      .from('digital_sets')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (!sets) return [];

    return Promise.all(sets.map(async (ds) => {
      const { data: evals } = await supabase
        .from('evaluations')
        .select('*, context_evaluations(*)')
        .eq('digital_set_id', ds.id)
        .order('created_at', { ascending: false });

      return {
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
        evaluations: (evals ?? []).map(ev => ({
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
        })),
      };
    }));
  };

  const mapModel = (row: {
    id: string;
    name: string;
    image?: string | null;
    contexts?: string[];
    status?: string;
  }, digitalSets: DigitalSet[]): RosterModel => {
    const allEvals = digitalSets.flatMap(ds => ds.evaluations ?? []);
    const allScores = allEvals.flatMap(ev =>
      ev.contexts.map(ctx => ctx.alignmentScore)
    );
    const topScore = allScores.length > 0 ? Math.max(...allScores) : 0;

    return {
      id: row.id,
      name: row.name,
      image: row.image ?? null,
      primaryContext: (row.contexts ?? [])[0] ?? '',
      contexts: row.contexts ?? [],
      renderedContexts: [],
      topScore,
      lastEvaluation: allEvals.length > 0
        ? allEvals[0].completedAt
        : 'No evaluations yet',
      status: row.status ?? 'ACTIVE',
      recentlySigned: false,
      division: '',
      digitalSets,
    };
  };

  const saveDigitalSets = async (entityId: string, digitalSets: DigitalSet[]) => {
    for (const ds of digitalSets) {
      const { data: savedSet, error } = await supabase
        .from('digital_sets')
        .upsert({
          id: ds.id,
          entity_id: entityId,
          entity_type: 'model',
          agency_id: agencyId,
          title: ds.title,
          uploaded_at: ds.uploadedAt,
          front: ds.front,
          profile: ds.profile,
          three_quarter: ds.threeQuarter,
          full_body: ds.fullBody,
          notes: ds.notes,
          tags: ds.tags,
        })
        .select()
        .single();

      if (error || !savedSet) continue;

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

  const loadModels = async () => {
    setLoading(true);
    try {
      const { data: modelsData, error } = await supabase
        .from('models')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!modelsData) return;

      const modelsWithSets = await Promise.all(
        modelsData.map(async (m) => {
          const digitalSets = await loadDigitalSets(m.id);
          return mapModel(m, digitalSets);
        })
      );

      setModels(modelsWithSets);
    } catch (err) {
      console.error('[RosterContext] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!agencyId) {
      setModels([]);
      setLoading(false);
      return;
    }
    loadModels();
  }, [agencyId]);

  const addModel = useCallback(async (model: RosterModel) => {
    if (!agencyId) return;
    try {
      const { data, error } = await supabase
        .from('models')
        .insert({
          id: model.id,
          agency_id: agencyId,
          name: model.name,
          status: model.status,
          markets: model.contexts,
          contexts: model.contexts,
          image: model.image ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (model.digitalSets?.length > 0) {
        await saveDigitalSets(model.id, model.digitalSets);
      }

      const digitalSets = await loadDigitalSets(model.id);
      const newModel = mapModel(data, digitalSets);
      setModels(prev => [newModel, ...prev]);
    } catch (err) {
      console.error('[RosterContext] addModel error:', err);
    }
  }, [agencyId]);

  const updateModel = useCallback(async (id: string, updates: Partial<RosterModel>) => {
    if (!agencyId) return;
    try {
      const { digitalSets, ...modelFields } = updates;

      if (Object.keys(modelFields).length > 0) {
        const { error } = await supabase
          .from('models')
          .update({
            name: modelFields.name,
            status: modelFields.status,
            contexts: modelFields.contexts,
            markets: modelFields.contexts,
            image: modelFields.image,
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
        .from('models')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        const freshSets = await loadDigitalSets(id);
        const updated = mapModel(data, freshSets);
        setModels(prev => prev.map(m => m.id === id ? updated : m));
      }
    } catch (err) {
      console.error('[RosterContext] updateModel error:', err);
    }
  }, [agencyId]);

  const removeModel = useCallback(async (id: string) => {
    if (!agencyId) return;
    try {
      await supabase.from('models').delete().eq('id', id);
      setModels(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('[RosterContext] removeModel error:', err);
    }
  }, [agencyId]);

  const getModelById = useCallback(
    (id: string) => models.find(m => m.id === id),
    [models]
  );

  const value = useMemo(
    () => ({
      models,
      addModel,
      updateModel,
      removeModel,
      getModelById,
    }),
    [models, addModel, updateModel, removeModel, getModelById]
  );

  return (
    <RosterContext.Provider value={value}>
      {children}
    </RosterContext.Provider>
  );
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within RosterProvider');
  }
  return context;
}
