/**
 * Article API client.
 * Thin wrappers around the article endpoints. Every function returns the
 * `data` payload directly and throws `ArticleApiError` for API failures.
 */
import type {
  AdminArticleQuery,
  ArticleApiFailure,
  ArticleApiResponse,
  ArticleCategory,
  ArticleDetail,
  ArticleErrorCode,
  ArticleListData,
  CreateArticleRequest,
  CreateCategoryRequest,
  DeleteData,
  PublicArticleQuery,
  UpdateArticleRequest,
  UpdateCategoryRequest,
  ValidationIssue,
} from '@/types/article';

const PUBLIC_BASE = '/api/articles';
const ADMIN_BASE = '/api/dashboard/admin/articles';

export class ArticleApiError extends Error {
  readonly status: number;
  readonly code: ArticleErrorCode;
  readonly details: ValidationIssue[];

  constructor(status: number, error: ArticleApiFailure['error']) {
    super(error.message);
    this.name = 'ArticleApiError';
    this.status = status;
    this.code = error.code;
    this.details = Array.isArray(error.details) ? error.details : [];
  }

  /** Validation issues keyed by field. Issues with an empty field are skipped. */
  fieldErrors(): Record<string, string> {
    return this.details.reduce<Record<string, string>>((acc, issue) => {
      if (issue.field && !acc[issue.field]) acc[issue.field] = issue.message;
      return acc;
    }, {});
  }
}

export const isArticleApiError = (error: unknown): error is ArticleApiError =>
  error instanceof ArticleApiError;

async function articleRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let result: ArticleApiResponse<T>;
  try {
    result = (await response.json()) as ArticleApiResponse<T>;
  } catch {
    throw new ArticleApiError(response.status, {
      code: response.status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
      message: 'Unexpected response from server',
    });
  }

  if (!result || result.success !== true) {
    const failure = (result as ArticleApiFailure | undefined)?.error;
    throw new ArticleApiError(response.status, {
      code: failure?.code ?? 'INTERNAL_SERVER_ERROR',
      message: failure?.message ?? 'Request failed',
      details: failure?.details,
    });
  }

  return result.data;
}

/**
 * Builds a query string following the contract: integers as plain digits,
 * "all" filters omitted entirely, empty search omitted.
 */
export function buildArticleQuery(query: AdminArticleQuery = {}): string {
  const params = new URLSearchParams();
  const positiveInt = (value: number | undefined) =>
    typeof value === 'number' && Number.isInteger(value) && value > 0;

  if (positiveInt(query.categoryId)) {
    params.set('categoryId', String(query.categoryId));
  }
  const search = query.search?.trim();
  if (search) params.set('search', search.slice(0, 255));
  if (positiveInt(query.page)) params.set('page', String(query.page));
  if (positiveInt(query.limit)) params.set('limit', String(query.limit));
  if (query.status === 'DRAFT' || query.status === 'PUBLISHED') {
    params.set('status', query.status);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// --- Public ---
export const getPublishedArticles = (query: PublicArticleQuery = {}) =>
  articleRequest<ArticleListData>(
    `${PUBLIC_BASE}${buildArticleQuery({ ...query, status: undefined })}`,
  );

export const getPublishedArticle = (id: number) =>
  articleRequest<ArticleDetail>(`${PUBLIC_BASE}/${id}`);

export const getArticleCategories = () =>
  articleRequest<ArticleCategory[]>(`${PUBLIC_BASE}/categories`);

// --- Admin: articles ---
export const getAdminArticles = (query: AdminArticleQuery = {}) =>
  articleRequest<ArticleListData>(`${ADMIN_BASE}${buildArticleQuery(query)}`);

export const getAdminArticle = (id: number) =>
  articleRequest<ArticleDetail>(`${ADMIN_BASE}/${id}`);

export const createArticle = (payload: CreateArticleRequest) =>
  articleRequest<ArticleDetail>(ADMIN_BASE, 'POST', payload);

export const updateArticle = (id: number, payload: UpdateArticleRequest) =>
  articleRequest<ArticleDetail>(`${ADMIN_BASE}/${id}`, 'PATCH', payload);

export const deleteArticle = (id: number) =>
  articleRequest<DeleteData>(`${ADMIN_BASE}/${id}`, 'DELETE');

// --- Admin: categories ---
export const getAdminArticleCategories = () =>
  articleRequest<ArticleCategory[]>(`${ADMIN_BASE}/categories`);

export const createArticleCategory = (payload: CreateCategoryRequest) =>
  articleRequest<ArticleCategory>(`${ADMIN_BASE}/categories`, 'POST', payload);

export const updateArticleCategory = (
  id: number,
  payload: UpdateCategoryRequest,
) =>
  articleRequest<ArticleCategory>(
    `${ADMIN_BASE}/categories/${id}`,
    'PATCH',
    payload,
  );

export const deleteArticleCategory = (id: number) =>
  articleRequest<DeleteData>(`${ADMIN_BASE}/categories/${id}`, 'DELETE');

/** Query keys shared by every article screen, so mutations can invalidate them. */
export const articleKeys = {
  all: ['articles'] as const,
  publicList: (query: PublicArticleQuery) =>
    ['articles', 'public', 'list', query] as const,
  publicDetail: (id: number) => ['articles', 'public', 'detail', id] as const,
  adminList: (query: AdminArticleQuery) =>
    ['articles', 'admin', 'list', query] as const,
  adminDetail: (id: number) => ['articles', 'admin', 'detail', id] as const,
  categories: ['article-categories'] as const,
};

/** Parses a route param into a valid article/category ID, or null. */
export function parseArticleId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= 2_147_483_647 ? id : null;
}

/** User-facing message for an unknown error thrown by the client. */
export function getArticleErrorMessage(error: unknown, fallback: string) {
  if (isArticleApiError(error)) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'Your session has expired. Please log in again.';
      case 'FORBIDDEN':
        return 'You do not have access to this action.';
      case 'NOT_FOUND':
        return 'The requested data was not found.';
      case 'INTERNAL_SERVER_ERROR':
        return 'Something went wrong on the server. Please try again.';
      default:
        return error.message || fallback;
    }
  }
  return fallback;
}
