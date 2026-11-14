import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';

import type {
  ArticleFilterQuery,
  CreateArticleCategoryInput,
  CreateArticleInput,
  UpdateArticleCategoryInput,
  UpdateArticleInput,
} from './article.types';

const articleListSelect = {
  id: true,
  title: true,
  summary: true,
  imageUrl: true,
  categoryId: true,
  category: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect;

export const findArticles = async (
  query: ArticleFilterQuery,
  publishedOnly: boolean,
) => {
  const { page, limit, categoryId, search } = query;
  const where: Prisma.ArticleWhereInput = {
    ...(publishedOnly
      ? { status: 'PUBLISHED' }
      : query.status
        ? { status: query.status }
        : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
  const [articles, totalCount] = await prisma.$transaction(
    [
      prisma.article.findMany({
        where,
        select: articleListSelect,
        orderBy: publishedOnly
          ? [{ publishedAt: 'desc' }, { id: 'desc' }]
          : [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );
  return {
    articles,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
};

export const findArticleById = (id: number, publishedOnly = false) =>
  prisma.article.findFirst({
    where: { id, ...(publishedOnly ? { status: 'PUBLISHED' } : {}) },
    include: { category: true },
  });

export const createArticle = (data: CreateArticleInput) =>
  prisma.article.create({
    data: {
      ...data,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
    include: { category: true },
  });

export const updateArticle = (id: number, data: UpdateArticleInput) =>
  prisma.$transaction(async (tx) => {
    const article = await tx.article.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'DRAFT' ? { publishedAt: null } : {}),
      },
      include: { category: true },
    });
    // The update locks this row, keeping publication dates consistent during concurrent edits.
    if (article.status === 'PUBLISHED' && !article.publishedAt) {
      return tx.article.update({
        where: { id },
        data: { publishedAt: new Date() },
        include: { category: true },
      });
    }
    return article;
  });

export const deleteArticle = (id: number) =>
  prisma.article.delete({ where: { id } });
export const findCategoryById = (id: number) =>
  prisma.articleCategory.findUnique({ where: { id } });
export const findCategories = () =>
  prisma.articleCategory.findMany({
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  });
export const createCategory = (data: CreateArticleCategoryInput) =>
  prisma.articleCategory.create({ data });
export const updateCategory = (id: number, data: UpdateArticleCategoryInput) =>
  prisma.articleCategory.update({ where: { id }, data });
export const countArticlesByCategory = (categoryId: number) =>
  prisma.article.count({ where: { categoryId } });
export const deleteCategory = (id: number) =>
  prisma.articleCategory.delete({ where: { id } });
