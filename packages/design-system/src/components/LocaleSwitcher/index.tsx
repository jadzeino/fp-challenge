import * as React from 'react';
import { useLocale, useT, type SupportedLocale } from '@raisin/common-i18n';
import { spacing, typography, colors, radius } from '@raisin/design-tokens';

const LABEL_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing.sm,
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  color: colors.text.muted,
};

const SELECT_STYLE: React.CSSProperties = {
  fontFamily: typography.fontFamily.sans,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radius.sm,
  background: colors.surface.card,
  color: colors.text.default,
};

/**
 * Small <select>-based locale switcher backed by @raisin/common-i18n.
 * Intentionally unstyled beyond design-tokens defaults so apps can
 * compose it inside any layout.
 */
export const LocaleSwitcher: React.FC = () => {
  const t = useT();
  const { locale, setLocale, supported } = useLocale();
  return (
    <label style={LABEL_STYLE}>
      <span>{t('locale.switcher_label')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        style={SELECT_STYLE}
        aria-label={t('locale.switcher_label')}
      >
        {supported.map((l) => (
          <option key={l} value={l}>
            {t(`locale.${l}`)}
          </option>
        ))}
      </select>
    </label>
  );
};
