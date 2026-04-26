import React from 'react';
import { usePrefetchCrossApp } from '../../hooks/usePrefetchCrossApp';

export interface CrossAppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Inject a prefetch hint for the destination zone on hover/focus. Default true. */
  prefetch?: boolean;
}

/**
 * Drop-in replacement for <a> when navigating between platform zones.
 *
 * On hover or focus it injects a <link rel="prefetch"> for the destination
 * zone's _app chunk so the hard navigation feels faster. Compatible with MUI
 * Button via the `component` prop:
 *
 *   <Button component={CrossAppLink} href="/app2">Go to app2</Button>
 */
export const CrossAppLink = React.forwardRef<HTMLAnchorElement, CrossAppLinkProps>(
  function CrossAppLink(
    { href, prefetch = true, onMouseEnter, onFocus, children, ...rest },
    ref,
  ) {
    const triggerPrefetch = usePrefetchCrossApp(href, { enabled: prefetch });

    return (
      <a
        ref={ref}
        href={href}
        onMouseEnter={(e) => {
          triggerPrefetch();
          onMouseEnter?.(e);
        }}
        onFocus={(e) => {
          triggerPrefetch();
          onFocus?.(e);
        }}
        {...rest}
      >
        {children}
      </a>
    );
  },
);
