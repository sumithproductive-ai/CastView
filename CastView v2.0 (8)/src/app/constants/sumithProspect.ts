import sumithFront from '../../../assets/sumith-front.jpg';
import sumithProfile from '../../../assets/sumith-profile.jpg';
import sumithThreeQuarter from '../../../assets/sumith-three-quarter.jpg';
import sumithFullBody from '../../../assets/sumith-full-body.jpg';
import type { DigitalSet } from '../types/talent';

export const SUMITH_PROSPECT_ID = 'sumith-chittimalla';
export const SUMITH_PROSPECT_NAME = 'Sumith Chittimalla';

export const SUMITH_DIGITAL_SET_V1: DigitalSet = {
  id: 'digitals-v1',
  uploadedAt: 'May 2026',
  title: 'Initial Submission',
  front: sumithFront,
  profile: sumithProfile,
  threeQuarter: sumithThreeQuarter,
  fullBody: sumithFullBody,
  additionalImages: [],
  notes: '',
  tags: ['initial', 'submission'],
  evaluations: [
    {
      id: 'eval-1',
      completedAt: 'May 20, 2026',
      contexts: [
        {
          context: 'Fragrance',
          alignmentScore: 94,
          fitLabel: 'STRONG ALIGNMENT',
          reasoning:
            'Strong angular bone structure aligns with fragrance campaign framing criteria. Skin tone and undertone range scores well against editorial lighting benchmarks.',
          strengths: [
            'Strong bone structure aligns with fragrance context',
            'Skin tone scores well against editorial lighting',
            'Proportions support tight crop compositions',
          ],
          risks: ['Limited progression data — one digital set on file'],
          marketSignals: [
            'European luxury fragrance market trending toward this profile',
            'High demand in NYC and London markets',
          ],
          suggestedNextSteps: [
            'Schedule fragrance test shoot',
            'Upload updated digitals after next shoot',
          ],
        },
      ],
    },
  ],
};

export const sumithDigitals = {
  front: SUMITH_DIGITAL_SET_V1.front!,
  profile: SUMITH_DIGITAL_SET_V1.profile!,
  three_quarter: SUMITH_DIGITAL_SET_V1.threeQuarter!,
  full_body: SUMITH_DIGITAL_SET_V1.fullBody!,
};

export const sumithDigitalsList = [
  { label: 'Front', image: sumithDigitals.front },
  { label: 'Profile', image: sumithDigitals.profile },
  { label: '3/4', image: sumithDigitals.three_quarter },
  { label: 'Full Body', image: sumithDigitals.full_body },
];

export function isSumithProspect(prospectId?: string | null, name?: string | null) {
  if (prospectId === SUMITH_PROSPECT_ID) return true;
  if (!name) return false;
  return name.trim().toLowerCase() === SUMITH_PROSPECT_NAME.toLowerCase();
}
