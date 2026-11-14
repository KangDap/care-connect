/**
 * Article types for the frontend.
 * Mirrors the Article API contract (docs: articles-api.md). Dates are ISO
 * strings because responses are serialized JSON.
 */

export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface ArticleCategory {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem {
  id: number;
  title: string;
  summary: string;
  categoryId: number;
  category: ArticleCategory;
  imageUrl: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  ctaText: string;
  courseUrl: string;
}

export interface ArticleListData {
  articles: ArticleListItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeleteData {
  id: number;
}

export interface CreateArticleRequest {
  title: string;
  summary: string;
  content: string;
  categoryId: number;
  imageUrl?: string | null;
  ctaText: string;
  courseUrl: string;
  status?: ArticleStatus;
}

/** Backend requires at least one field on PATCH. */
export type UpdateArticleRequest = Partial<CreateArticleRequest>;

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface PublicArticleQuery {
  categoryId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminArticleQuery extends PublicArticleQuery {
  status?: ArticleStatus;
}

export type ArticleErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR';

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ArticleApiFailure {
  success: false;
  error: {
    code: ArticleErrorCode;
    message: string;
    details?: ValidationIssue[];
  };
}

export type ArticleApiSuccess<T> = { success: true; data: T };
export type ArticleApiResponse<T> = ArticleApiSuccess<T> | ArticleApiFailure;
