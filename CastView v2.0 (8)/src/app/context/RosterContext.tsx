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

const STORAGE_VERSION = 'v2';
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
    digitalSets: [],
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
