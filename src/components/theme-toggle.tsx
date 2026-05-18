'use client';

import { Button } from '@/components/button';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(
    new CustomEvent('careconnect-theme-change', {
      detail: theme,
    }),
  );
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';

    const storedTheme = localStorage.getItem('careconnect-theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;

    return storedTheme === 'dark' || (!storedTheme && prefersDark)
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('careconnect-theme', nextTheme);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggleTheme}
      className="icon-button theme-toggle-button h-9 w-9 rounded-full !p-0"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
    >
      {theme === 'dark' ? (
        <Sun className="theme-toggle-icon h-4 w-4" />
      ) : (
        <Moon className="theme-toggle-icon h-4 w-4" />
      )}
    </Button>
  );
}
