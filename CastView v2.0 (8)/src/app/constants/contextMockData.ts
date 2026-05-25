export type ContextMockEntry = {
  score: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

type ContextMockEntry = {
  score: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

export const CONTEXT_MOCK_DATA: Record<string, ContextMockEntry> = {
  Fragrance: {
    score: 94,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'The uploaded digitals show strong alignment with current European luxury fragrance casting criteria. Facial geometry, bone structure depth, and skin tone consistency match the visual language of high-end fragrance campaigns in the NYC and London markets.',
    strengths: [
      'Angular bone structure aligns with fragrance campaign framing criteria',
      'Skin tone and undertone range scores well against editorial lighting benchmarks',
      'Proportions support tight crop compositions typical of this context',
      'Profile definition strong — relevant for 3/4 fragrance framing',
    ],
    risks: [
      'Limited progression data — one digital set on file',
      'No fragrance-specific test shoot imagery to confirm on-set performance',
    ],
    marketSignals: [
      'European luxury fragrance market trending toward this profile type',
      'High demand for this look in NYC and London markets',
      'Dark editorial fragrance aesthetic currently active in major campaigns',
    ],
    suggestedNextSteps: [
      'Schedule fragrance test shoot as first priority',
      'Approach luxury fragrance clients in NYC market first',
      'Upload updated digitals after next shoot for progression tracking',
    ],
  },
  Editorial: {
    score: 91,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Editorial versatility indicators are strong. The digitals demonstrate a range of natural expression and structural presence that supports both close-crop and full-frame editorial compositions. Face and body proportion ratios are within standard editorial casting benchmarks.',
    strengths: [
      'Strong editorial presence — reads naturally in front of camera',
      'Versatile look range supports multiple editorial aesthetics',
      'Bone structure reads distinctly in both close-crop and wide frame',
      'Neutral expression holds well — critical for editorial context',
    ],
    risks: [
      'No editorial tear sheets or test shoot imagery on file yet',
      'Versatility across high-fashion and commercial editorial not yet tested',
    ],
    marketSignals: [
      'NYC editorial market currently active and receptive to this profile',
      'Strong alignment with current European editorial casting trends',
      'Demand for diverse editorial faces increasing in major market publications',
    ],
    suggestedNextSteps: [
      'Approach editorial clients in NYC and London simultaneously',
      'Schedule editorial test shoot targeting 2–3 distinct aesthetic ranges',
      'Build editorial-specific portfolio section before broader submission',
    ],
  },
  Runway: {
    score: 88,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Full body proportions and posture visible in digitals are consistent with runway casting criteria. Height-to-proportion ratios and shoulder-to-waist relationship align with current runway standards for menswear and luxury ready-to-wear.',
    strengths: [
      'Full body proportion ratio within runway standard range',
      'Posture and natural stance visible in full body digital is clean',
      'Shoulder structure supports structured garment silhouettes',
    ],
    risks: [
      'Walk and on-runway performance cannot be assessed from digitals alone',
      'Runway-specific movement evaluation requires in-person casting',
    ],
    marketSignals: [
      'Menswear runway market showing demand for this body type and aesthetic',
      'NY and Milan markets active for this profile category',
    ],
    suggestedNextSteps: [
      'Book an in-person casting to assess walk and movement',
      'Submit to menswear runway castings in next open season',
      'Review runway-specific comp card requirements before submission',
    ],
  },
  Campaign: {
    score: 88,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Commercial appeal indicators across the digitals are strong. The face reads clearly and warmly at distance — a key criterion for large-format campaign work. Approachability scores are above average for lifestyle and brand advertising contexts.',
    strengths: [
      'High commercial appeal across broad consumer demographics',
      'Face reads clearly at large format — critical for OOH campaign use',
      'Brand-fit indicators strong for lifestyle and luxury campaign contexts',
      'Neutral palette in digitals supports broad client brand color ranges',
    ],
    risks: [
      'Campaign versatility across premium and mass-market contexts not yet tested',
      'No campaign-specific portfolio section on file',
    ],
    marketSignals: [
      'Strong demand for this profile type in US campaign market',
      'Lifestyle brand campaigns trending toward this aesthetic in Q3–Q4',
    ],
    suggestedNextSteps: [
      'Target lifestyle brand campaigns as first campaign category',
      'Build campaign-specific portfolio section with varied backdrops',
      'Approach mid-tier brand clients before luxury campaign submission',
    ],
  },
  Beauty: {
    score: 87,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Skin tone consistency and facial symmetry visible in the uploaded digitals score well against beauty and skincare campaign benchmarks. Close-crop face digitals show clear skin texture and even undertone — both critical for beauty context casting.',
    strengths: [
      'Skin tone consistency strong across all digitals — critical for beauty context',
      'Facial symmetry above benchmark for beauty casting criteria',
      'Undertone range supports broad beauty brand product matching',
      'Close-crop digital shows clear texture — important for skincare context',
    ],
    risks: [
      'Beauty and grooming portfolio not yet established',
      'On-set beauty performance under close-crop lighting not yet tested',
    ],
    marketSignals: [
      'Grooming and male beauty context demand growing in NYC market',
      'Skincare brands increasingly casting diverse male profiles',
    ],
    suggestedNextSteps: [
      'Schedule beauty-specific test shoot with close-crop focus',
      'Approach skincare and grooming brand clients in first submission wave',
      'Build beauty context section of portfolio as standalone chapter',
    ],
  },
  Sportswear: {
    score: 85,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Body proportion and muscle definition visible in fitted digitals align with sportswear casting benchmarks. Athletic build and clean posture support performance brand aesthetics. Proportions suggest natural movement range relevant to active and sportswear contexts.',
    strengths: [
      'Athletic proportion visible in digitals aligns with sportswear benchmarks',
      'Clean posture supports performance brand visual language',
      'Proportions suggest natural movement range for active contexts',
    ],
    risks: [
      'Movement and athletic performance cannot be assessed from static digitals',
      'Sportswear-specific imagery not yet on file',
    ],
    marketSignals: [
      'Performance brand casting increasingly overlapping with editorial aesthetics',
      'Demand for athletic-editorial hybrid profiles growing in US market',
    ],
    suggestedNextSteps: [
      'Schedule sportswear-specific test shoot with movement focus',
      'Submit to mid-tier performance brands before premium athletic clients',
      'Consider adding movement or video component to digitals submission',
    ],
  },
  Couture: {
    score: 82,
    fitLabel: 'MODERATE ALIGNMENT',
    reasoning:
      'Couture context requires the highest specificity in proportion, posture, and aesthetic neutrality. The uploaded digitals show strong potential but limited couture-specific positioning. Bone structure and facial geometry are appropriate — further evaluation recommended after test shoot.',
    strengths: [
      'Bone structure and facial geometry appropriate for couture context',
      'Aesthetic neutrality in digitals supports couture visual language',
      'Proportion ratio within range for structured couture garment silhouettes',
    ],
    risks: [
      'Couture context requires in-person evaluation to confirm proportion fit',
      'No couture-specific imagery to assess garment interaction',
      'Highest risk context for miscast — recommend test shoot before submission',
    ],
    marketSignals: [
      'Couture casting heavily relationship-driven — agency positioning matters',
      'European couture houses active in NYC casting seasonally',
    ],
    suggestedNextSteps: [
      'Do not submit to couture clients until test shoot confirms fit',
      'Schedule couture-focused test shoot with structured garment styling',
      'Review European couture house casting requirements before approach',
    ],
  },
  Swimwear: {
    score: 86,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'Body proportion and physical condition visible in form-fitting digitals align with swimwear casting criteria. Torso-to-leg ratio and shoulder width are within benchmark range for menswear swimwear contexts in both editorial and commercial swimwear categories.',
    strengths: [
      'Torso-to-leg proportion within swimwear casting benchmark range',
      'Shoulder width supports both editorial and commercial swimwear framing',
      'Physical condition visible in fitted digitals is appropriate for context',
    ],
    risks: [
      'No swimwear-specific test imagery to assess on-location performance',
      'Outdoor and water-based shoot performance cannot be assessed from digitals',
    ],
    marketSignals: [
      'Swimwear editorial market active in Q1–Q2 for following season campaigns',
      'Demand for diverse male swimwear profiles growing in editorial context',
    ],
    suggestedNextSteps: [
      'Schedule swimwear test shoot before season submission window opens',
      'Target editorial swimwear submissions before commercial swimwear clients',
      'Build dedicated swimwear chapter in portfolio before broader submission',
    ],
  },
  Streetwear: {
    score: 89,
    fitLabel: 'STRONG ALIGNMENT',
    reasoning:
      'The overall aesthetic presence in the digitals — facial structure, natural styling, and body proportions — aligns well with the current streetwear and urban fashion market. The look reads as contemporary and culturally relevant, which is the primary casting criterion for this context.',
    strengths: [
      'Overall aesthetic reads as contemporary and culturally relevant',
      'Natural styling in digitals aligns with streetwear brand visual language',
      'Facial structure supports both close-crop and full-body streetwear framing',
      'Proportions support layered and oversized streetwear silhouettes',
    ],
    risks: [
      'Streetwear context is trend-sensitive — timing of submission matters',
      'No streetwear-specific portfolio imagery on file',
    ],
    marketSignals: [
      'Urban fashion market highly active for this profile type in NYC',
      'Streetwear-editorial crossover trending strongly in current market cycle',
    ],
    suggestedNextSteps: [
      'Submit to streetwear and urban brand clients in current market window',
      'Build streetwear-specific portfolio section with contemporary styling',
      'Approach NYC-based streetwear brands before national brand submission',
    ],
  },
};

const GENERIC_CONTEXT_FALLBACK: ContextMockEntry = {
  score: 85,
  fitLabel: 'STRONG ALIGNMENT',
  reasoning: 'Strong alignment with context criteria based on uploaded digitals.',
  strengths: ['Digitals meet context benchmarks'],
  risks: ['Limited progression data on file'],
  marketSignals: ['Market demand present for this profile'],
  suggestedNextSteps: ['Schedule context-specific test shoot'],
};

export function getContextData(context: string): ContextMockEntry {
  return CONTEXT_MOCK_DATA[context] ?? GENERIC_CONTEXT_FALLBACK;
}