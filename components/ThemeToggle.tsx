'use client';

import { useCallback, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ORDER: Theme[] = ['system', 'light', 'dark'];

const ICONS: Record<Theme, string> = {
  system: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2v14a7 7 0 0 1 0-14Z',
  light:
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-6v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  dark: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
};

const LABELS: Record<Theme, string> = {
  system: 'Theme: match system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

/**
 * The theme lives on `<html data-theme>`, stamped by an inline script before
 * first paint. That attribute is the source of truth, so this reads it as
 * external state rather than mirroring it into React — mirroring would either
 * flash the wrong icon or mismatch during hydration.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  const value = document.documentElement.getAttribute('data-theme');
  return value === 'light' || value === 'dark' ? value : 'system';
}

export default function ThemeToggle() {
  // The server has no document, so it renders the neutral "system" icon.
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'system' as Theme);

  const cycle = useCallback(() => {
    const next = ORDER[(ORDER.indexOf(readTheme()) + 1) % ORDER.length];
    const root = document.documentElement;
    try {
      if (next === 'system') {
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        root.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
      }
    } catch {
      // Private browsing can block storage; the attribute still applies.
      if (next === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', next);
    }
  }, []);

  const isOutline = theme === 'light';

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={isOutline ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={isOutline ? 1.8 : 0}
        strokeLinecap="round"
        aria-hidden
      >
        <path d={ICONS[theme]} />
      </svg>
    </button>
  );
}
