import React from 'react';
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
import sumithFront from '@/assets/sumith-front.jpg';
import sumithProfile from '@/assets/sumith-profile.jpg';
import sumithThreeQuarter from '@/assets/sumith-three-quarter.jpg';
import sumithFullBody from '@/assets/sumith-full-body.jpg';
import type { DigitalSet } from '../types/talent';

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

const STORAGE_VERSION = 'v4';
const STORAGE_VERSION_KEY = 'castview_roster_version';
const STORAGE_KEY = 'castview_roster';

const SEED_MODELS: RosterModel[] = [
  {
    id: 'sumith-chittimalla-roster',
    name: 'Sumith Chittimalla',
    image: sumithThumbnail,
    primaryContext: 'FRAGRANCE',
    contexts: ['FR', 'ED', 'CA'],
    renderedContexts: ['FR', 'ED'],
    topScore: 94,
    lastEvaluation: '3 days ago',
    status: 'ACTIVE',
    recentlySigned: true,
    division: 'men',
    digitalSets: [
      {
        id: 'sumith-roster-ds-1',
        uploadedAt: 'May 2026',
        title: 'May 2026 Update',
        front: sumithFront,
        profile: sumithProfile,
        threeQuarter: sumithThreeQuarter,
        fullBody: sumithFullBody,
        additionalImages: [],
        notes: 'Updated digitals post first season.',
        tags: ['updated', 'post-season'],
        evaluations: [],
      },
    ],
  },
  {
    id: 'john-doe-roster',
    name: 'John Doe',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    primaryContext: 'EDITORIAL',
    contexts: ['FR', 'ED', 'RW'],
    renderedContexts: ['FR', 'ED'],
    topScore: 87,
    lastEvaluation: '1 week ago',
    status: 'ACTIVE',
    recentlySigned: false,
    division: 'men',
    digitalSets: [
      {
        id: 'john-ds-2',
        uploadedAt: 'May 2026',
        title: 'Updated Digitals',
        front: 'https://images.unsplash.com/photo-1618008797651-3eb256213400?w=800',
        profile: 'https://images.unsplash.com/photo-1618008797651-3eb256213400?w=800',
        threeQuarter: 'https://images.unsplash.com/photo-1618008797651-3eb256213400?w=800',
        fullBody: 'https://images.unsplash.com/photo-1618008797651-3eb256213400?w=800',
        additionalImages: [],
        notes: 'Second submission — updated after first season.',
        tags: ['updated'],
        evaluations: [
          {
            id: 'john-eval-2',
            completedAt: 'May 10, 2026',
            contexts: [
              {
                context: 'Fragrance',
                alignmentScore: 87,
                fitLabel: 'STRONG ALIGNMENT',
                reasoning: 'Updated digitals show improved bone structure visibility.',
                strengths: ['Improved contrast range', 'Stronger profile definition'],
                risks: ['Limited market data'],
                marketSignals: ['Strong demand in EU markets'],
                suggestedNextSteps: ['Schedule fragrance test shoot'],
              },
              {
                context: 'Editorial',
                alignmentScore: 91,
                fitLabel: 'STRONG ALIGNMENT',
                reasoning: 'Editorial indicators improved significantly from first set.',
                strengths: ['Strong editorial framing', 'Versatile look range'],
                risks: [],
                marketSignals: ['NYC editorial market active'],
                suggestedNextSteps: ['Approach editorial clients in NYC'],
              },
            ],
          },
        ],
      },
      {
        id: 'john-ds-1',
        uploadedAt: 'January 2026',
        title: 'Initial Submission',
        front: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
        profile: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
        threeQuarter: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
        fullBody: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800',
        additionalImages: [],
        notes: 'First submission after signing.',
        tags: ['initial'],
        evaluations: [
          {
            id: 'john-eval-1',
            completedAt: 'January 15, 2026',
            contexts: [
              {
                context: 'Fragrance',
                alignmentScore: 78,
                fitLabel: 'MODERATE ALIGNMENT',
                reasoning: 'Initial digitals show potential but limited progression data.',
                strengths: ['Good bone structure baseline'],
                risks: ['Image quality inconsistent', 'Limited contrast range'],
                marketSignals: ['Early stage — more data needed'],
                suggestedNextSteps: ['Schedule updated digitals shoot', 'Focus on lighting quality'],
              },
              {
                context: 'Editorial',
                alignmentScore: 82,
                fitLabel: 'STRONG ALIGNMENT',
                reasoning: 'Editorial potential visible in initial submission.',
                strengths: ['Natural editorial presence'],
                risks: ['Needs updated digitals'],
                marketSignals: ['Editorial market receptive'],
                suggestedNextSteps: ['Update digitals within 60 days'],
              },
            ],
          },
        ],
      },
    ],
  },
];

function isValidRosterModel(value: unknown): value is RosterModel {
  if (!value || typeof value !== 'object') return false;
  const model = value as RosterModel;
  return (
    typeof model.id === 'string' &&
    typeof model.name === 'string' &&
    typeof model.primaryContext === 'string' &&
    typeof model.topScore === 'number' &&
    typeof model.lastEvaluation === 'string' &&
    typeof model.status === 'string' &&
    typeof model.recentlySigned === 'boolean' &&
    typeof model.division === 'string' &&
    Array.isArray(model.contexts) &&
    Array.isArray(model.renderedContexts) &&
    Array.isArray(model.digitalSets) &&
    (model.image === null || typeof model.image === 'string')
  );
}

function loadModelsFromStorage(): RosterModel[] {
  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
      return SEED_MODELS;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_MODELS;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_MODELS;
    if (!parsed.every(isValidRosterModel)) return SEED_MODELS;

    return parsed;
  } catch {
    return SEED_MODELS;
  }
}

type RosterContextType = {
  models: RosterModel[];
  addModel: (model: RosterModel) => void;
  updateModel: (id: string, updates: Partial<RosterModel>) => void;
  removeModel: (id: string) => void;
  getModelById: (id: string) => RosterModel | undefined;
};

const RosterContext = createContext<RosterContextType | undefined>(undefined);

export function RosterProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<RosterModel[]>(loadModelsFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  }, [models]);

  const addModel = useCallback((model: RosterModel) => {
    setModels((prev) => [model, ...prev]);
  }, []);

  const updateModel = useCallback((id: string, updates: Partial<RosterModel>) => {
    setModels((prev) =>
      prev.map((model) => (model.id === id ? { ...model, ...updates } : model)),
    );
  }, []);

  const removeModel = useCallback((id: string) => {
    setModels((prev) => prev.filter((model) => model.id !== id));
  }, []);

  const getModelById = useCallback(
    (id: string) => models.find((model) => model.id === id),
    [models],
  );

  const value = useMemo(
    () => ({
      models,
      addModel,
      updateModel,
      removeModel,
      getModelById,
    }),
    [models, addModel, updateModel, removeModel, getModelById],
  );

  return (
    <RosterContext.Provider value={value}>{children}</RosterContext.Provider>
  );
}

export function useRoster() {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within RosterProvider');
  }
  return context;
}
