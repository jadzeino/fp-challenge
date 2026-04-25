# @raisin/common-i18n

Shared i18n provider, hooks, and global translations for the Raisin platform. Built on i18next + react-i18next so the surface is familiar; consumers depend on the wrapper, not the lib, so a future swap stays a one-package change.

## Two namespace tiers

- `global` — labels shared across all apps (currency, dates, common actions). Source of truth lives here.
- `app:<name>` — per-app strings supplied by each app via `appResources`.

App-local keys override `global` for the same logical label, so an app can re-skin a shared term without forking the namespace.

## Usage

```tsx
import { I18nProvider, useT, useLocale } from '@raisin/common-i18n';

function App({ children }) {
  return (
    <I18nProvider app="app1" appResources={{ en: appEn, de: appDe }}>
      {children}
    </I18nProvider>
  );
}

function Greeting() {
  const t = useT();
  return <h1>{t('common.welcome')}</h1>;
}

function LocaleSwitcher() {
  const { locale, setLocale, supported } = useLocale();
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'de')}>
      {supported.map((l) => <option key={l} value={l}>{l}</option>)}
    </select>
  );
}
```

## Cross-zone persistence

Locale is stored in a cookie scoped to `Path=/`, so switching to `de` on `/app1` and navigating to `/app2` (a different gateway zone) keeps the German UI. Without this, the user would silently lose their choice on every cross-zone navigation.

ADR 0009 covers namespace tiers, fallback rules, and the production move to a remote translation backend.
