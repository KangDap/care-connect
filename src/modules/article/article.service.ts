import { Prisma } from '@/generated/prisma/client';
import { Errors } from '@/lib/error';

import * as repository from './article.repositories';
import type {
  ArticleFilterQuery,
  CreateArticleCategoryInput,
  CreateArticleInput,
  UpdateArticleCategoryInput,
  UpdateArticleInput,
} from './article.types';

async function requireCategory(id: number) {
  if (!(await repository.findCategoryById(id))) {
    throw Errors.notFound('Article category not found');
  }
}

// Database constraints also protect against category changes between validation and writing.
async function write<T>(
  operation: () => Promise<T>,
  categoryDelete = false,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        throw Errors.notFound('Article or category not found');
      if (error.code === 'P2002')
        throw Errors.conflict('Article category name already exists');
      if (error.code === 'P2003') {
        throw Errors.conflict(
          categoryDelete
            ? 'Category is still used by articles. Reassign or delete those articles first.'
            : 'Article category no longer exists',
        );
      }
    }
    throw error;
  }
}

export class ArticleService {
  static getArticles(query: ArticleFilterQuery, publishedOnly = false) {
    return repository.findArticles(query, publishedOnly);
  }

  static async getArticleById(id: number, publishedOnly = false) {
    const article = await repository.findArticleById(id, publishedOnly);
    if (!article) throw Errors.notFound('Article not found');
    return article;
  }

  static async createArticle(input: CreateArticleInput) {
    await requireCategory(input.categoryId);
    return write(() => repository.createArticle(input));
  }

  static async updateArticle(id: number, input: UpdateArticleInput) {
    if (input.categoryId !== undefined) await requireCategory(input.categoryId);
    return write(() => repository.updateArticle(id, input));
  }

  static async deleteArticle(id: number) {
    await write(() => repository.deleteArticle(id));
    return { id };
  }

  static getCategories() {
    return repository.findCategories();
  }

  static createCategory(input: CreateArticleCategoryInput) {
    return write(() => repository.createCategory(input));
  }

  static updateCategory(id: number, input: UpdateArticleCategoryInput) {
    return write(() => repository.updateCategory(id, input));
  }

  static async deleteCategory(id: number) {
    await requireCategory(id);
    if (await repository.countArticlesByCategory(id)) {
      throw Errors.conflict(
        'Category is still used by articles. Reassign or delete those articles first.',
      );
    }
    await write(() => repository.deleteCategory(id), true);
    return { id };
  }
}
