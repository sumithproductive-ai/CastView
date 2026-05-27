export type ContextEvaluation = {
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

export type Evaluation = {
  id: string;
  completedAt: string;
  contexts: ContextEvaluation[];
  agentNotes?: string;
};

export type DigitalSet = {
  id: string;
  uploadedAt: string;
  title: string;
  front: string | null;
  profile: string | null;
  threeQuarter: string | null;
  fullBody: string | null;
  additionalImages: string[];
  notes: string;
  tags: string[];
  evaluations: Evaluation[];
};
