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
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      const storedTheme = localStorage.getItem('careconnect-theme');
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      const initialTheme =
        storedTheme === 'dark' || (!storedTheme && prefersDark)
          ? 'dark'
          : 'light';
      setTheme(initialTheme);
      setMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('careconnect-theme', nextTheme);
  };

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        className="icon-button theme-toggle-button h-9 w-9 rounded-full !p-0"
        title="Switch theme"
        aria-label="Switch theme"
      >
        <Moon className="theme-toggle-icon h-4 w-4 opacity-50" />
      </Button>
    );
  }

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
