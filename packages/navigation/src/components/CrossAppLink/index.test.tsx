import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CrossAppLink } from '.';

function getPrefetchLinks(href: string) {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="prefetch"]')).filter(
    (l) => l.href.includes(href),
  );
}

afterEach(() => {
  // Clean up injected prefetch links between tests.
  document.head.querySelectorAll('link[rel="prefetch"]').forEach((l) => l.remove());
  // Reset the module-level Set by re-importing would require jest.resetModules;
  // instead we rely on the component's triggered ref resetting on each render.
});

describe('CrossAppLink', () => {
  it('renders an anchor with the correct href', () => {
    const { getByRole } = render(<CrossAppLink href="/app2">Go</CrossAppLink>);
    expect(getByRole('link')).toHaveAttribute('href', '/app2');
  });

  it('injects a prefetch link for the destination _app chunk on mouseEnter', () => {
    const { getByRole } = render(<CrossAppLink href="/app2">Go</CrossAppLink>);
    fireEvent.mouseEnter(getByRole('link'));
    const links = getPrefetchLinks('/app2/_next/static/chunks/pages/_app.js');
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('prefetch');
    expect(links[0].as).toBe('script');
  });

  it('does not duplicate prefetch links on repeated mouseEnter', () => {
    const { getByRole } = render(<CrossAppLink href="/app2">Go</CrossAppLink>);
    const link = getByRole('link');
    fireEvent.mouseEnter(link);
    fireEvent.mouseEnter(link);
    fireEvent.mouseEnter(link);
    expect(getPrefetchLinks('/app2/_next/static/chunks/pages/_app.js')).toHaveLength(1);
  });

  it('does not inject prefetch when prefetch=false', () => {
    const { getByRole } = render(
      <CrossAppLink href="/app3" prefetch={false}>
        Go
      </CrossAppLink>,
    );
    fireEvent.mouseEnter(getByRole('link'));
    expect(getPrefetchLinks('/app3/_next/static/chunks/pages/_app.js')).toHaveLength(0);
  });

  it('calls the caller-supplied onMouseEnter as well', () => {
    const onMouseEnter = jest.fn();
    const { getByRole } = render(
      <CrossAppLink href="/app2" onMouseEnter={onMouseEnter}>
        Go
      </CrossAppLink>,
    );
    fireEvent.mouseEnter(getByRole('link'));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });
});
