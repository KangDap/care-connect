import {
  ARTICLE_CATEGORIES_HREF,
  ARTICLE_MANAGEMENT_HREF,
  parseArticleManagementTab,
} from '@/app/dashboard/admin/articles/article-management-tabs';
import { describe, expect, it } from 'vitest';

describe('article management tabs', { tags: ['frontend'] }, () => {
  it('opens the categories tab only for tab=categories', () => {
    expect(parseArticleManagementTab('categories')).toBe('categories');
  });

  it.each([null, undefined, '', 'articles', 'CATEGORIES', 'unknown'])(
    'falls back to the articles tab for %s',
    (value) => {
      expect(parseArticleManagementTab(value)).toBe('articles');
    },
  );

  it('links the categories tab inside Article Management', () => {
    expect(ARTICLE_MANAGEMENT_HREF).toBe('/dashboard/admin/articles');
    expect(ARTICLE_CATEGORIES_HREF).toBe(
      '/dashboard/admin/articles?tab=categories',
    );
  });
});
