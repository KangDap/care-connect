import type { ArticleStatus } from '@/generated/prisma/enums';
import type { z } from 'zod';

import type {
  CREATE_ARTICLE_CATEGORY_SCHEMA,
  CREATE_ARTICLE_SCHEMA,
  UPDATE_ARTICLE_CATEGORY_SCHEMA,
  UPDATE_ARTICLE_SCHEMA,
} from './article.schema';

export type CreateArticleInput = z.infer<typeof CREATE_ARTICLE_SCHEMA>;
export type UpdateArticleInput = z.infer<typeof UPDATE_ARTICLE_SCHEMA>;
export type CreateArticleCategoryInput = z.infer<
  typeof CREATE_ARTICLE_CATEGORY_SCHEMA
>;
export type UpdateArticleCategoryInput = z.infer<
  typeof UPDATE_ARTICLE_CATEGORY_SCHEMA
>;
export interface ArticleFilterQuery {
  categoryId?: number;
  search?: string;
  status?: ArticleStatus;
  page: number;
  limit: number;
}
