import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';
import enDashboard from '../locales/en/dashboard.json';
import esDashboard from '../locales/es/dashboard.json';
import enSettings from '../locales/en/settings.json';
import esSettings from '../locales/es/settings.json';
import enProspects from '../locales/en/prospects.json';
import esProspects from '../locales/es/prospects.json';
import enRoster from '../locales/en/roster.json';
import esRoster from '../locales/es/roster.json';
import enInbox from '../locales/en/inbox.json';
import esInbox from '../locales/es/inbox.json';

// Per-user display language — deliberately separate from the agency-level
// "AI Output Language" setting (Settings → Agency), which only affects
// AI-generated evaluation/extraction text. This is the app UI itself.
// Follows the same localStorage-only pattern as ThemeContext — no DB sync,
// device-local preference, consistent with how this codebase already
// handles light/dark mode.
export const STORAGE_KEY = 'castview-language';
export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function readStoredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
    ? (stored as SupportedLanguage)
    : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon, dashboard: enDashboard, settings: enSettings, prospects: enProspects, roster: enRoster, inbox: enInbox },
    es: { common: esCommon, dashboard: esDashboard, settings: esSettings, prospects: esProspects, roster: esRoster, inbox: esInbox },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
