import * as React from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import {
  createI18n,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type CreateI18nOptions,
} from './i18n';
import { writeLocaleCookie } from './locale-cookie';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  supported: ReadonlyArray<SupportedLocale>;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export interface I18nProviderProps extends CreateI18nOptions {
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, ...opts }) => {
  const i18nRef = React.useRef<ReturnType<typeof createI18n> | null>(null);
  if (!i18nRef.current) i18nRef.current = createI18n(opts);
  const i18n = i18nRef.current;

  const [locale, setLocaleState] = React.useState<SupportedLocale>(
    i18n.language as SupportedLocale,
  );

  const setLocale = React.useCallback(
    (next: SupportedLocale) => {
      i18n.changeLanguage(next);
      writeLocaleCookie(next);
      setLocaleState(next);
    },
    [i18n],
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, supported: SUPPORTED_LOCALES }),
    [locale, setLocale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
};

export const useLocale = (): I18nContextValue => {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used inside <I18nProvider>');
  return ctx;
};

/**
 * Thin wrapper around react-i18next's useTranslation so consumers do
 * not directly depend on the underlying lib.
 */
export const useT = (): ((key: string, vars?: Record<string, unknown>) => string) => {
  const { t } = useTranslation();
  // Stable identity so consumers can put the result in useEffect/useCallback
  // dep arrays without triggering update loops on every render.
  return React.useCallback(
    (key: string, vars?: Record<string, unknown>) => t(key, vars ?? {}),
    [t],
  );
};
