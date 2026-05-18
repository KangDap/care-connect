'use client';

import { en } from '@/i18n/en';
import { id } from '@/i18n/id';
import { phraseTranslations } from '@/i18n/phrases';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type Language = 'en' | 'id';

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateText: (value: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_NODE_NAMES = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEXTAREA',
  'CODE',
  'PRE',
  'SVG',
]);

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const enToId = new Map<string, string>(
  Object.entries(phraseTranslations).map(([english, indonesia]) => [
    normalizeText(english),
    indonesia,
  ]),
);

const idToEn = new Map<string, string>();

Object.entries(phraseTranslations).forEach(([english, indonesia]) => {
  const normalizedId = normalizeText(indonesia);
  if (!idToEn.has(normalizedId)) {
    idToEn.set(normalizedId, english);
  }
});

const shouldSkipTextNode = (node: Text) => {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest('[data-no-translate]')) return true;

  let current: Element | null = parent;
  while (current) {
    if (SKIP_NODE_NAMES.has(current.nodeName)) return true;
    current = current.parentElement;
  }

  return false;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const isApplyingTranslations = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem('care-connect-lang');
    if (stored === 'en' || stored === 'id') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('care-connect-lang', lang);
  };

  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
  ): string => {
    return (
      (path
        .split('.')
        .reduce(
          (acc: unknown, part: string) =>
            acc && typeof acc === 'object'
              ? (acc as Record<string, unknown>)[part]
              : undefined,
          obj,
        ) as string) || path
    );
  };

  const t = (key: string): string => {
    const dict = language === 'en' ? en : id;
    return getNestedValue(dict, key);
  };

  const translateText = useMemo(
    () =>
      (value: string): string => {
        const normalized = normalizeText(value);
        if (!normalized) return value;

        const translated =
          language === 'id' ? enToId.get(normalized) : idToEn.get(normalized);

        if (!translated) return value;

        const leadingWhitespace = value.match(/^\s*/)?.[0] ?? '';
        const trailingWhitespace = value.match(/\s*$/)?.[0] ?? '';
        return `${leadingWhitespace}${translated}${trailingWhitespace}`;
      },
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textNode = node as Text;
        if (shouldSkipTextNode(textNode)) return;

        const nextText = translateText(textNode.nodeValue ?? '');
        if (nextText !== textNode.nodeValue) {
          textNode.nodeValue = nextText;
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as HTMLElement;
      if (element.closest('[data-no-translate]')) return;
      if (SKIP_NODE_NAMES.has(element.nodeName)) return;

      TRANSLATABLE_ATTRIBUTES.forEach((attribute) => {
        const value = element.getAttribute(attribute);
        if (!value) return;

        const nextValue = translateText(value);
        if (nextValue !== value) {
          element.setAttribute(attribute, nextValue);
        }
      });

      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode: (textNode) =>
          shouldSkipTextNode(textNode as Text)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT,
      });

      const textNodes: Text[] = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
      }

      textNodes.forEach((textNode) => {
        const nextText = translateText(textNode.nodeValue ?? '');
        if (nextText !== textNode.nodeValue) {
          textNode.nodeValue = nextText;
        }
      });
    };

    const applyTranslations = () => {
      if (isApplyingTranslations.current) return;

      isApplyingTranslations.current = true;
      translateNode(document.body);
      isApplyingTranslations.current = false;
    };

    applyTranslations();

    const observer = new MutationObserver((mutations) => {
      if (isApplyingTranslations.current) return;

      window.requestAnimationFrame(() => {
        if (isApplyingTranslations.current) return;

        isApplyingTranslations.current = true;
        mutations.forEach((mutation) => {
          if (mutation.type === 'characterData') {
            translateNode(mutation.target);
            return;
          }

          mutation.addedNodes.forEach(translateNode);
        });
        isApplyingTranslations.current = false;
      });
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language, translateText]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translateText }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
