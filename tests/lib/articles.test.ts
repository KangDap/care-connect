import {
  ArticleApiError,
  buildArticleQuery,
  createArticle,
  deleteArticleCategory,
  getAdminArticles,
  getArticleErrorMessage,
  getPublishedArticles,
  parseArticleId,
  updateArticle,
} from '@/lib/api/articles';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const listData = {
  articles: [],
  totalCount: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

const mockFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(body),
  });

describe('buildArticleQuery', { tags: ['frontend'] }, () => {
  it('returns an empty string when no filter is set', () => {
    expect(buildArticleQuery()).toBe('');
    expect(buildArticleQuery({ search: '   ' })).toBe('');
  });

  it('omits invalid integers instead of sending them', () => {
    expect(buildArticleQuery({ categoryId: 0, page: -1, limit: 1.5 })).toBe('');
  });

  it('encodes search and keeps valid filters', () => {
    expect(
      buildArticleQuery({
        categoryId: 2,
        search: ' stres & cemas ',
        page: 3,
        limit: 10,
        status: 'DRAFT',
      }),
    ).toBe('?categoryId=2&search=stres+%26+cemas&page=3&limit=10&status=DRAFT');
  });

  it('caps search at 255 characters', () => {
    const qs = buildArticleQuery({ search: 'a'.repeat(300) });
    expect(new URLSearchParams(qs).get('search')).toHaveLength(255);
  });
});

describe('parseArticleId', { tags: ['frontend'] }, () => {
  it.each([
    ['7', 7],
    ['2147483647', 2147483647],
  ])('accepts %s', (input, expected) => {
    expect(parseArticleId(input)).toBe(expected);
  });

  it.each(['0', '-1', '1.5', '01', 'abc', '', '2147483648'])(
    'rejects %s',
    (input) => {
      expect(parseArticleId(input)).toBeNull();
    },
  );

  it('handles undefined and arrays', () => {
    expect(parseArticleId(undefined)).toBeNull();
    expect(parseArticleId(['4', '5'])).toBe(4);
  });
});

describe('article API client', { tags: ['frontend'] }, () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('never sends a status filter on the public list', async () => {
    const fetchMock = mockFetch(200, { success: true, data: listData });
    global.fetch = fetchMock;

    await getPublishedArticles({ page: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/articles?page=2',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('returns the data payload for the admin list', async () => {
    global.fetch = mockFetch(200, { success: true, data: listData });

    await expect(getAdminArticles({ status: 'PUBLISHED' })).resolves.toEqual(
      listData,
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/dashboard/admin/articles?status=PUBLISHED',
      expect.anything(),
    );
  });

  it('sends JSON bodies for create and update', async () => {
    const fetchMock = mockFetch(201, { success: true, data: { id: 1 } });
    global.fetch = fetchMock;

    await createArticle({
      title: 'A',
      summary: 'B',
      content: 'C',
      categoryId: 1,
      ctaText: 'D',
      courseUrl: 'https://example.com',
    });
    await updateArticle(1, { status: 'PUBLISHED' });

    const [createPath, createInit] = fetchMock.mock.calls[0];
    expect(createPath).toBe('/api/dashboard/admin/articles');
    expect(createInit.method).toBe('POST');
    expect(createInit.headers['Content-Type']).toBe('application/json');

    const [updatePath, updateInit] = fetchMock.mock.calls[1];
    expect(updatePath).toBe('/api/dashboard/admin/articles/1');
    expect(updateInit.method).toBe('PATCH');
    expect(JSON.parse(updateInit.body)).toEqual({ status: 'PUBLISHED' });
  });

  it('throws ArticleApiError with status, code, and field errors', async () => {
    global.fetch = mockFetch(400, {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid article data',
        details: [
          { field: 'title', message: 'Too small' },
          { field: '', message: 'Whole object' },
        ],
      },
    });

    const error = await updateArticle(1, { title: '' }).catch((e) => e);

    expect(error).toBeInstanceOf(ArticleApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.fieldErrors()).toEqual({ title: 'Too small' });
  });

  it('surfaces a conflict when deleting a category in use', async () => {
    global.fetch = mockFetch(409, {
      success: false,
      error: { code: 'CONFLICT', message: 'Category is still used' },
    });

    await expect(deleteArticleCategory(3)).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
  });

  it('turns a non-JSON response into an ArticleApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 502,
      ok: false,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    });

    await expect(getPublishedArticles()).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});

describe('getArticleErrorMessage', { tags: ['frontend'] }, () => {
  it('uses a friendly message per error code', () => {
    const error = new ArticleApiError(401, {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    expect(getArticleErrorMessage(error, 'fallback')).toMatch(/log in again/);
  });

  it('falls back for unknown errors', () => {
    expect(getArticleErrorMessage(new Error('x'), 'fallback')).toBe('fallback');
  });
});
