export const SUMITH_PROSPECT_ID = 'sumith-chittimalla';
export const SUMITH_PROSPECT_NAME = 'Sumith Chittimalla';

export const sumithDigitals = {
  front: 'https://i.imgur.com/jZHp7Ei.jpg',
  profile: 'https://i.imgur.com/aBlfily.jpg',
  three_quarter: 'https://i.imgur.com/AlYexxj.jpg',
  full_body: 'https://i.imgur.com/sH8hoNb.jpg',
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
