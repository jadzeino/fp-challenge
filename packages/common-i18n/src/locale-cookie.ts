/**
 * Locale persistence via cookie. Cookie scope is "/" so the locale
 * survives gateway hops between zones (app1 -> app2 -> app3) without
 * resetting. SameSite=Lax keeps it from leaking to third parties.
 */
const COOKIE = 'raisin-locale';
const ONE_YEAR = 60 * 60 * 24 * 365;

const isBrowser = (): boolean => typeof document !== 'undefined';

export const readLocaleCookie = (): string | null => {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]!) : null;
};

export const writeLocaleCookie = (locale: string): void => {
  if (!isBrowser()) return;
  document.cookie = `${COOKIE}=${encodeURIComponent(locale)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax`;
};
