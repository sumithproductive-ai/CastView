import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { SUMITH_DIGITAL_SET_V1 } from '../constants/sumithProspect';
import type { DigitalSet } from '../types/talent';

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

const STORAGE_KEY = 'castview_prospects';

const SEED_PROSPECTS: Prospect[] = [
  {
    id: 'sumith-chittimalla',
    name: 'Sumith Chittimalla',
    status: 'IN REVIEW',
    statusColor: '#C8A96E',
    evaluations: 1,
    submissionDate: '2 days ago',
    source: 'DIRECT',
    image: 'https://i.imgur.com/F70z8kX.jpg',
    contexts: ['FR', 'ED', 'CA'],
    renderedContexts: ['FR'],
    division: 'men',
    primaryContext: 'FRAGRANCE',
    markets: ['NYC', 'London'],
    height: "6'1\"",
    measurements: { chest: '38', waist: '30', hips: '33', shoe: '11' },
    digitalSets: [SUMITH_DIGITAL_SET_V1],
  },
];

function isValidProspect(value: unknown): value is Prospect {
  if (!value || typeof value !== 'object') return false;
  const prospect = value as Prospect;
  return (
    typeof prospect.id === 'string' &&
    typeof prospect.name === 'string' &&
    typeof prospect.status === 'string' &&
    typeof prospect.statusColor === 'string' &&
    typeof prospect.evaluations === 'number' &&
    typeof prospect.submissionDate === 'string' &&
    Array.isArray(prospect.contexts) &&
    Array.isArray(prospect.renderedContexts) &&
    Array.isArray(prospect.digitalSets) &&
    (prospect.image === null || typeof prospect.image === 'string')
  );
}

function loadProspectsFromStorage(): Prospect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_PROSPECTS;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_PROSPECTS;
    if (!parsed.every(isValidProspect)) return SEED_PROSPECTS;

    return parsed;
  } catch {
    return SEED_PROSPECTS;
  }
}

type ProspectsContextType = {
  prospects: Prospect[];
  addProspect: (prospect: Prospect) => void;
  updateProspect: (id: string, updates: Partial<Prospect>) => void;
  getProspectById: (id: string) => Prospect | undefined;
};

const ProspectsContext = createContext<ProspectsContextType | undefined>(undefined);

export function ProspectsProvider({ children }: { children: ReactNode }) {
  const [prospects, setProspects] = useState<Prospect[]>(loadProspectsFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  }, [prospects]);

  const addProspect = useCallback((prospect: Prospect) => {
    setProspects((prev) => [prospect, ...prev]);
  }, []);

  const updateProspect = useCallback((id: string, updates: Partial<Prospect>) => {
    setProspects((prev) =>
      prev.map((prospect) =>
        prospect.id === id ? { ...prospect, ...updates } : prospect,
      ),
    );
  }, []);

  const getProspectById = useCallback(
    (id: string) => prospects.find((prospect) => prospect.id === id),
    [prospects],
  );

  const value = useMemo(
    () => ({
      prospects,
      addProspect,
      updateProspect,
      getProspectById,
    }),
    [prospects, addProspect, updateProspect, getProspectById],
  );

  return (
    <ProspectsContext.Provider value={value}>{children}</ProspectsContext.Provider>
  );
}

export function useProspects() {
  const context = useContext(ProspectsContext);
  if (!context) {
    throw new Error('useProspects must be used within ProspectsProvider');
  }
  return context;
}
