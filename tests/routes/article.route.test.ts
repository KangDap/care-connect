// @vitest-environment node
import { GET as publicDetail } from '@/app/api/articles/[id]/route';
import { GET as publicCategories } from '@/app/api/articles/categories/route';
import { GET as publicList } from '@/app/api/articles/route';
import {
  GET as adminDetail,
  DELETE as deleteArticle,
  PATCH as updateArticle,
} from '@/app/api/dashboard/admin/articles/[id]/route';
import {
  DELETE as deleteCategory,
  PATCH as updateCategory,
} from '@/app/api/dashboard/admin/articles/categories/[id]/route';
import {
  GET as adminCategories,
  POST as createCategory,
} from '@/app/api/dashboard/admin/articles/categories/route';
import {
  GET as adminList,
  POST as createArticle,
} from '@/app/api/dashboard/admin/articles/route';
import { Prisma } from '@/generated/prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const article = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const articleCategory = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    getSession: vi.fn(),
    article,
    articleCategory,
    user: { findUnique: vi.fn() },
    transaction: vi.fn(),
  };
});

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@/lib/auth/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    article: mocks.article,
    articleCategory: mocks.articleCategory,
    user: mocks.user,
    $transaction: mocks.transaction,
  },
}));

const input = {
  title: 'Mengenal stres',
  summary: 'Cara memahami dan mengelola stres.',
  content: 'Pembahasan, edukasi, dan tips mengelola stres.',
  categoryId: 1,
  ctaText: 'Pelajari lebih lanjut',
  courseUrl: 'https://example.com/course/stres',
};
const category = { id: 1, name: 'Manajemen Stres', description: null };
const article = {
  ...input,
  id: 7,
  imageUrl: null,
  status: 'DRAFT',
  publishedAt: null,
  category,
  createdAt: new Date('2026-10-17T00:00:00Z'),
  updatedAt: new Date('2026-10-17T00:00:00Z'),
};
const context = (id = '7') => ({ params: Promise.resolve({ id }) });
function request(body?: unknown, method = 'GET', path = '/api/articles') {
  return new Request(`http://localhost:3000${path}`, {
    method,
    ...(body === undefined
      ? {}
      : {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }),
  });
}
const dbError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('Constraint failed', {
    code,
    clientVersion: '7.8.0',
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({
    user: { id: 'admin-1', role: 'ADMIN' },
  });
  mocks.articleCategory.findUnique.mockResolvedValue(category);
  mocks.articleCategory.findMany.mockResolvedValue([category]);
  mocks.article.findMany.mockResolvedValue([]);
  mocks.article.count.mockResolvedValue(0);
  mocks.article.findFirst.mockResolvedValue(article);
  mocks.article.create.mockResolvedValue(article);
  mocks.article.update.mockResolvedValue(article);
  mocks.article.delete.mockResolvedValue(article);
  mocks.articleCategory.create.mockResolvedValue(category);
  mocks.articleCategory.update.mockResolvedValue(category);
  mocks.articleCategory.delete.mockResolvedValue(category);
  mocks.transaction.mockImplementation((operation) =>
    typeof operation === 'function'
      ? operation({
          article: mocks.article,
          articleCategory: mocks.articleCategory,
        })
      : Promise.all(operation),
  );
});

describe('Article administration access', () => {
  const routes = [
    () => adminList(request()),
    () => createArticle(request(input, 'POST')),
    () => adminDetail(request(), context()),
    () => updateArticle(request({ title: 'Updated' }, 'PATCH'), context()),
    () => deleteArticle(request(undefined, 'DELETE'), context()),
    () => adminCategories(),
    () => createCategory(request({ name: 'Stres' }, 'POST')),
    () => updateCategory(request({ name: 'Stres' }, 'PATCH'), context('1')),
    () => deleteCategory(request(undefined, 'DELETE'), context('1')),
  ];
  it.each(routes.map((route, index) => [index, route] as const))(
    'requires login for admin handler %i',
    async (_index, route) => {
      mocks.getSession.mockResolvedValue(null);
      expect((await route()).status).toBe(401);
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.article.create).not.toHaveBeenCalled();
    },
  );
  it.each(routes.map((route, index) => [index, route] as const))(
    'rejects non-admin for handler %i',
    async (_index, route) => {
      mocks.getSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
      expect((await route()).status).toBe(403);
      expect(mocks.articleCategory.findMany).not.toHaveBeenCalled();
      expect(mocks.articleCategory.delete).not.toHaveBeenCalled();
    },
  );
});

describe('Article reads', () => {
  it('forces PUBLISHED for public search even when the caller supplies DRAFT', async () => {
    mocks.getSession.mockResolvedValue(null);
    mocks.article.count.mockResolvedValue(31);
    const res = await publicList(
      request(
        undefined,
        'GET',
        '/api/articles?status=DRAFT&categoryId=1&search=stres&page=2&limit=10',
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({
      articles: [],
      totalCount: 31,
      page: 2,
      limit: 10,
      totalPages: 4,
    });
    expect(mocks.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PUBLISHED',
          categoryId: 1,
          OR: [
            { title: { contains: 'stres', mode: 'insensitive' } },
            { summary: { contains: 'stres', mode: 'insensitive' } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(mocks.article.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: 'PUBLISHED', categoryId: 1 }),
    });
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
  it('lists all statuses by default for admin and supports a status filter', async () => {
    expect((await adminList(request())).status).toBe(200);
    expect(mocks.article.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: {} }),
    );
    await adminList(
      request(undefined, 'GET', '/api/dashboard/admin/articles?status=DRAFT'),
    );
    expect(mocks.article.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { status: 'DRAFT' } }),
    );
  });
  it('returns 404 for unpublished or missing public articles', async () => {
    mocks.article.findFirst.mockResolvedValue(null);
    expect((await publicDetail(request(), context())).status).toBe(404);
    expect(mocks.article.findFirst).toHaveBeenCalledWith({
      where: { id: 7, status: 'PUBLISHED' },
      include: { category: true },
    });
  });
  it('returns content and CTA for a published article', async () => {
    mocks.article.findFirst.mockResolvedValue({
      ...article,
      status: 'PUBLISHED',
    });
    const res = await publicDetail(request(), context());
    expect((await res.json()).data).toMatchObject({
      content: input.content,
      ctaText: input.ctaText,
      courseUrl: input.courseUrl,
    });
  });
  it('allows admin to read drafts', async () => {
    const res = await adminDetail(request(), context());
    expect((await res.json()).data.status).toBe('DRAFT');
    expect(mocks.article.findFirst).toHaveBeenCalledWith({
      where: { id: 7 },
      include: { category: true },
    });
  });
  it.each(['0', '-1', '1.5', 'abc', '2147483648'])(
    'rejects invalid article ID %s',
    async (id) => {
      expect((await publicDetail(request(), context(id))).status).toBe(400);
      expect(mocks.article.findFirst).not.toHaveBeenCalled();
    },
  );
  it.each(['page=0', 'limit=101', 'categoryId=-1', 'page=1.5', 'page=1e2'])(
    'rejects invalid query %s',
    async (query) => {
      expect(
        (await publicList(request(undefined, 'GET', `/api/articles?${query}`)))
          .status,
      ).toBe(400);
      expect(mocks.article.findMany).not.toHaveBeenCalled();
    },
  );
  it('lists categories without requiring authentication', async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await (await publicCategories()).json()).data).toEqual([category]);
  });
});

describe('Article writes and publication', () => {
  it('creates a draft by default and trims text', async () => {
    const res = await createArticle(
      request({ ...input, title: '  Mengenal stres  ' }, 'POST'),
    );
    expect(res.status).toBe(201);
    expect(mocks.article.create).toHaveBeenCalledWith({
      data: { ...input, status: 'DRAFT', publishedAt: null },
      include: { category: true },
    });
  });
  it('records the publication date when created as published', async () => {
    await createArticle(
      request(
        {
          ...input,
          status: 'PUBLISHED',
          imageUrl: 'https://example.com/image.png',
        },
        'POST',
      ),
    );
    expect(mocks.article.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PUBLISHED',
          publishedAt: expect.any(Date),
        }),
      }),
    );
  });
  it('rejects nonexistent categories', async () => {
    mocks.articleCategory.findUnique.mockResolvedValue(null);
    expect((await createArticle(request(input, 'POST'))).status).toBe(404);
    expect(mocks.article.create).not.toHaveBeenCalled();
    expect(
      (await updateArticle(request({ categoryId: 99 }, 'PATCH'), context()))
        .status,
    ).toBe(404);
  });
  it.each([
    { title: '  ' },
    { summary: '' },
    { content: '' },
    { categoryId: true },
    { courseUrl: 'javascript:alert(1)' },
    { courseUrl: 'invalid url' },
    { courseUrl: 'https://user:secret@example.com/course' },
    { imageUrl: 'data:image/png;base64,test' },
    { ctaText: '' },
    { status: 'ARCHIVED' },
    { publishedAt: '2026-01-01' },
  ])('rejects invalid fields %j', async (fields) => {
    expect(
      (await createArticle(request({ ...input, ...fields }, 'POST'))).status,
    ).toBe(400);
    expect(mocks.article.create).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON and empty updates', async () => {
    const malformed = new Request('http://localhost/api/articles', {
      method: 'POST',
      body: '{',
    });
    expect((await createArticle(malformed)).status).toBe(400);
    expect((await updateArticle(request({}, 'PATCH'), context())).status).toBe(
      400,
    );
  });
  it('sets a publication date when a draft becomes published', async () => {
    mocks.article.update.mockResolvedValueOnce({
      ...article,
      status: 'PUBLISHED',
    });
    await updateArticle(request({ status: 'PUBLISHED' }, 'PATCH'), context());
    expect(mocks.article.update).toHaveBeenNthCalledWith(2, {
      where: { id: 7 },
      data: { publishedAt: expect.any(Date) },
      include: { category: true },
    });
  });
  it('preserves the publication date on edits and repeated publishing', async () => {
    mocks.article.update.mockResolvedValue({
      ...article,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-10-01'),
    });
    await updateArticle(
      request(
        { title: 'Tips stres', status: 'PUBLISHED', imageUrl: null },
        'PATCH',
      ),
      context(),
    );
    expect(mocks.article.update).toHaveBeenCalledTimes(1);
    expect(mocks.article.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { title: 'Tips stres', status: 'PUBLISHED', imageUrl: null },
      include: { category: true },
    });
  });
  it('does not reset publication status when only content is edited', async () => {
    mocks.article.update.mockResolvedValue({
      ...article,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-10-01'),
    });
    await updateArticle(
      request({ content: 'Konten baru' }, 'PATCH'),
      context(),
    );
    expect(mocks.article.update).toHaveBeenCalledTimes(1);
    expect(mocks.article.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { content: 'Konten baru' },
      include: { category: true },
    });
  });
  it('clears the publication date when reverting to draft', async () => {
    await updateArticle(request({ status: 'DRAFT' }, 'PATCH'), context());
    expect(mocks.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'DRAFT', publishedAt: null } }),
    );
  });
  it('deletes articles and returns the deleted ID', async () => {
    expect(
      (await (await deleteArticle(request(), context())).json()).data,
    ).toEqual({ id: 7 });
    expect(mocks.article.delete).toHaveBeenCalledWith({ where: { id: 7 } });
  });
  it('returns 404 for missing update/delete targets', async () => {
    mocks.article.update.mockRejectedValue(dbError('P2025'));
    mocks.article.delete.mockRejectedValue(dbError('P2025'));
    expect(
      (await updateArticle(request({ title: 'Updated' }, 'PATCH'), context()))
        .status,
    ).toBe(404);
    expect((await deleteArticle(request(), context())).status).toBe(404);
  });
});

describe('Category management', () => {
  it('creates and updates categories', async () => {
    expect(
      (
        await createCategory(
          request({ name: ' Stres ', description: 'Tips stres' }, 'POST'),
        )
      ).status,
    ).toBe(201);
    expect(mocks.articleCategory.create).toHaveBeenCalledWith({
      data: { name: 'Stres', description: 'Tips stres' },
    });
    expect(
      (
        await updateCategory(
          request({ description: null }, 'PATCH'),
          context('1'),
        )
      ).status,
    ).toBe(200);
    expect(mocks.articleCategory.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { description: null },
    });
  });
  it('rejects empty category names and empty updates', async () => {
    expect((await createCategory(request({ name: '  ' }, 'POST'))).status).toBe(
      400,
    );
    expect(
      (await updateCategory(request({}, 'PATCH'), context('1'))).status,
    ).toBe(400);
  });
  it('returns 409 for duplicate names on create and update', async () => {
    mocks.articleCategory.create.mockRejectedValue(dbError('P2002'));
    mocks.articleCategory.update.mockRejectedValue(dbError('P2002'));
    expect(
      (await createCategory(request({ name: 'Stres' }, 'POST'))).status,
    ).toBe(409);
    expect(
      (await updateCategory(request({ name: 'Stres' }, 'PATCH'), context('1')))
        .status,
    ).toBe(409);
  });
  it('prevents deleting a category used by draft or published articles', async () => {
    mocks.article.count.mockResolvedValue(1);
    expect((await deleteCategory(request(), context('1'))).status).toBe(409);
    expect(mocks.article.count).toHaveBeenCalledWith({
      where: { categoryId: 1 },
    });
    expect(mocks.articleCategory.delete).not.toHaveBeenCalled();
  });
  it('deletes an unused category', async () => {
    expect(
      (await (await deleteCategory(request(), context('1'))).json()).data,
    ).toEqual({ id: 1 });
    expect(mocks.articleCategory.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
  it('handles a concurrent article creation that prevents category deletion', async () => {
    mocks.articleCategory.delete.mockRejectedValue(dbError('P2003'));
    expect((await deleteCategory(request(), context('1'))).status).toBe(409);
  });
  it('handles a category removed after article validation', async () => {
    mocks.article.create.mockRejectedValue(dbError('P2003'));
    expect((await createArticle(request(input, 'POST'))).status).toBe(409);
  });
  it('returns 404 for missing categories', async () => {
    mocks.articleCategory.findUnique.mockResolvedValue(null);
    expect((await deleteCategory(request(), context('1'))).status).toBe(404);
    mocks.articleCategory.update.mockRejectedValue(dbError('P2025'));
    expect(
      (await updateCategory(request({ name: 'New' }, 'PATCH'), context('1')))
        .status,
    ).toBe(404);
  });
});
