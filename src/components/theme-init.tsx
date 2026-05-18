'use client';

import { useEffect } from 'react';

export function ThemeInit() {
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('careconnect-theme');
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      const theme = storedTheme || (prefersDark ? 'dark' : 'light');

      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
      window.dispatchEvent(
        new CustomEvent('careconnect-theme-change', {
          detail: theme,
        }),
      );
    } catch {
      // Ignore theme bootstrap failures in restricted browser contexts.
    }
  }, []);

  return null;
}
