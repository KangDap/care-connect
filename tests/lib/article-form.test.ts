import {
  type ArticleFormValues,
  articleToFormValues,
  buildCreatePayload,
  buildUpdatePayload,
  emptyArticleForm,
  isFormDirty,
  isValidWebUrl,
  validateArticleForm,
} from '@/lib/article-form';
import type { ArticleDetail } from '@/types/article';
import { describe, expect, it } from 'vitest';

const article: ArticleDetail = {
  id: 7,
  title: 'Mengenal Stres',
  summary: 'Ringkasan',
  content: 'Isi',
  categoryId: 1,
  category: {
    id: 1,
    name: 'Manajemen Stres',
    description: null,
    createdAt: '2026-10-17T02:00:00.000Z',
    updatedAt: '2026-10-17T02:00:00.000Z',
  },
  imageUrl: null,
  ctaText: 'Pelajari lebih lanjut',
  courseUrl: 'https://example.com/course',
  status: 'DRAFT',
  publishedAt: null,
  createdAt: '2026-10-17T02:30:00.000Z',
  updatedAt: '2026-10-17T02:30:00.000Z',
};

const validValues = (): ArticleFormValues => ({
  ...emptyArticleForm(),
  title: 'Judul',
  summary: 'Ringkasan',
  content: 'Isi',
  categoryId: '1',
  courseUrl: 'https://example.com/course',
});

describe('validateArticleForm', { tags: ['frontend'] }, () => {
  it('passes a complete form', () => {
    expect(validateArticleForm(validValues())).toEqual({});
  });

  it('requires every mandatory field, even for drafts', () => {
    const errors = validateArticleForm({
      ...emptyArticleForm(),
      ctaText: '   ',
    });
    expect(Object.keys(errors).sort()).toEqual(
      [
        'categoryId',
        'content',
        'courseUrl',
        'ctaText',
        'summary',
        'title',
      ].sort(),
    );
  });

  it('enforces the backend length limits after trimming', () => {
    const errors = validateArticleForm({
      ...validValues(),
      title: 'a'.repeat(256),
      summary: `  ${'b'.repeat(1000)}  `,
    });
    expect(errors.title).toBeDefined();
    expect(errors.summary).toBeUndefined();
  });

  it('rejects unsafe or relative URLs', () => {
    expect(
      validateArticleForm({
        ...validValues(),
        courseUrl: 'javascript:alert(1)',
      }).courseUrl,
    ).toBeDefined();
    expect(
      validateArticleForm({ ...validValues(), imageUrl: '/img.png' }).imageUrl,
    ).toBeDefined();
    expect(
      validateArticleForm({ ...validValues(), imageUrl: '' }).imageUrl,
    ).toBeUndefined();
  });

  it('rejects URLs with credentials', () => {
    expect(isValidWebUrl('https://user:pass@example.com')).toBe(false);
    expect(isValidWebUrl('https://example.com/a?b=c')).toBe(true);
  });
});

describe('payload builders', { tags: ['frontend'] }, () => {
  it('builds a trimmed create payload with a numeric category', () => {
    expect(
      buildCreatePayload(
        { ...validValues(), title: '  Judul  ', imageUrl: '  ' },
        'PUBLISHED',
      ),
    ).toEqual({
      title: 'Judul',
      summary: 'Ringkasan',
      content: 'Isi',
      categoryId: 1,
      imageUrl: null,
      ctaText: 'Pelajari lebih lanjut di Unpad Luhung',
      courseUrl: 'https://example.com/course',
      status: 'PUBLISHED',
    });
  });

  it('sends only changed fields on update', () => {
    const values = { ...articleToFormValues(article), title: 'Judul Baru' };
    expect(buildUpdatePayload(article, values, 'DRAFT')).toEqual({
      title: 'Judul Baru',
    });
  });

  it('returns an empty payload when nothing changed', () => {
    expect(
      buildUpdatePayload(article, articleToFormValues(article), 'DRAFT'),
    ).toEqual({});
  });

  it('includes status changes and image removal', () => {
    const withImage = { ...article, imageUrl: 'https://example.com/a.png' };
    const values = { ...articleToFormValues(withImage), imageUrl: '' };
    expect(buildUpdatePayload(withImage, values, 'PUBLISHED')).toEqual({
      imageUrl: null,
      status: 'PUBLISHED',
    });
  });

  it('detects dirty forms', () => {
    const base = articleToFormValues(article);
    expect(isFormDirty(base, { ...base })).toBe(false);
    expect(isFormDirty(base, { ...base, content: 'x' })).toBe(true);
  });
});
