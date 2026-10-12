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
import enNewEntry from '../locales/en/newEntry.json';
import esNewEntry from '../locales/es/newEntry.json';
import enProfile from '../locales/en/profile.json';
import esProfile from '../locales/es/profile.json';
import enRendering from '../locales/en/rendering.json';
import esRendering from '../locales/es/rendering.json';
import enRenderHistory from '../locales/en/renderHistory.json';
import esRenderHistory from '../locales/es/renderHistory.json';
import enResults from '../locales/en/results.json';
import esResults from '../locales/es/results.json';
import enCompare from '../locales/en/compare.json';
import esCompare from '../locales/es/compare.json';
import enMessages from '../locales/en/messages.json';
import esMessages from '../locales/es/messages.json';
import enNotifications from '../locales/en/notifications.json';
import esNotifications from '../locales/es/notifications.json';
import enUploadDigitalSet from '../locales/en/uploadDigitalSet.json';
import esUploadDigitalSet from '../locales/es/uploadDigitalSet.json';

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
    en: { common: enCommon, dashboard: enDashboard, settings: enSettings, prospects: enProspects, roster: enRoster, inbox: enInbox, newEntry: enNewEntry, profile: enProfile, rendering: enRendering, renderHistory: enRenderHistory, results: enResults, compare: enCompare, messages: enMessages, notifications: enNotifications, uploadDigitalSet: enUploadDigitalSet },
    es: { common: esCommon, dashboard: esDashboard, settings: esSettings, prospects: esProspects, roster: esRoster, inbox: esInbox, newEntry: esNewEntry, profile: esProfile, rendering: esRendering, renderHistory: esRenderHistory, results: esResults, compare: esCompare, messages: esMessages, notifications: esNotifications, uploadDigitalSet: esUploadDigitalSet },
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
