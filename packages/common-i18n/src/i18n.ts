import i18n, { type i18n as I18nInstance, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import globalEn from './locales/global/en.json';
import globalDe from './locales/global/de.json';
import { readLocaleCookie } from './locale-cookie';

export type SupportedLocale = 'en' | 'de';

export const SUPPORTED_LOCALES: ReadonlyArray<SupportedLocale> = ['en', 'de'];

export interface CreateI18nOptions {
  /** App name. Used to scope the app:<name> namespace. */
  app: string;
  /** Optional per-app translation bundles, keyed by locale. */
  appResources?: Partial<Record<SupportedLocale, Record<string, unknown>>>;
  /** Override the default-locale-resolution chain. */
  defaultLocale?: SupportedLocale;
}

const resolveInitialLocale = (defaultLocale: SupportedLocale): SupportedLocale => {
  const fromCookie = readLocaleCookie();
  if (fromCookie === 'en' || fromCookie === 'de') return fromCookie;
  return defaultLocale;
};

export const createI18n = (opts: CreateI18nOptions): I18nInstance => {
  const { app, appResources, defaultLocale = 'en' } = opts;
  const namespace = `app:${app}`;

  const resources: Resource = {
    en: { global: globalEn, [namespace]: appResources?.en ?? {} },
    de: { global: globalDe, [namespace]: appResources?.de ?? {} },
  };

  const instance = i18n.createInstance();
  instance.use(initReactI18next).init({
    resources,
    lng: resolveInitialLocale(defaultLocale),
    fallbackLng: 'en',
    // App namespace is the primary lookup so useT() resolves app-specific
    // keys (home.*, accounts.*, session.*) without a namespace prefix.
    // Global namespace is the fallback for shared keys (locale labels etc.).
    defaultNS: namespace,
    ns: [namespace, 'global'],
    fallbackNS: ['global'],
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
};
