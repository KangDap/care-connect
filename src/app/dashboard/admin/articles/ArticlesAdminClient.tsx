'use client';

import { Alert } from '@/components/alert';
import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Table } from '@/components/table';
import { Toast } from '@/components/toast';
import {
  articleKeys,
  deleteArticle,
  getAdminArticleCategories,
  getAdminArticles,
  getArticleErrorMessage,
  isArticleApiError,
  parseArticleId,
  updateArticle,
} from '@/lib/api/articles';
import { formatArticleDate } from '@/lib/article-content';
import type {
  AdminArticleQuery,
  ArticleListItem,
  ArticleStatus,
} from '@/types/article';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ARTICLE_CATEGORIES_HREF } from './article-management-tabs';

const PAGE_SIZE = 10;
const STATUS_TABS: { label: string; value: ArticleStatus | null }[] = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
];

type ToastState = { show: boolean; msg: string; type: 'success' | 'error' };

export function ArticlesAdminClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const statusParam = searchParams.get('status');
  const status: ArticleStatus | undefined =
    statusParam === 'DRAFT' || statusParam === 'PUBLISHED'
      ? statusParam
      : undefined;
  const categoryId = parseArticleId(searchParams.get('category') ?? undefined);
  const page = parseArticleId(searchParams.get('page') ?? undefined) ?? 1;
  const search = (searchParams.get('search') || '').trim();

  const [toast, setToast] = useState<ToastState>({
    show: false,
    msg: '',
    type: 'success',
  });
  const [toDelete, setToDelete] = useState<ArticleListItem | null>(null);

  const query: AdminArticleQuery = {
    status,
    categoryId: categoryId ?? undefined,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const articlesQuery = useQuery({
    queryKey: articleKeys.adminList(query),
    queryFn: () => getAdminArticles(query),
    placeholderData: keepPreviousData,
  });
  const categoriesQuery = useQuery({
    queryKey: articleKeys.categories,
    queryFn: getAdminArticleCategories,
  });

  // A lost session on an admin endpoint means the user must log in again.
  useEffect(() => {
    const error = articlesQuery.error ?? categoriesQuery.error;
    if (isArticleApiError(error) && error.status === 401) {
      router.push('/login');
    }
  }, [articlesQuery.error, categoriesQuery.error, router]);

  const showToast = (msg: string, type: ToastState['type']) =>
    setToast({ show: true, msg, type });

  const invalidateArticles = () =>
    queryClient.invalidateQueries({ queryKey: articleKeys.all });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: ArticleStatus }) =>
      updateArticle(id, { status: next }),
    onSuccess: (article) => {
      showToast(
        article.status === 'PUBLISHED'
          ? 'Article published.'
          : 'Article moved to draft.',
        'success',
      );
      invalidateArticles();
    },
    onError: (error) =>
      showToast(
        getArticleErrorMessage(error, 'Failed to update article status.'),
        'error',
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteArticle(id),
    onSuccess: () => {
      showToast('Article deleted.', 'success');
      setToDelete(null);
      invalidateArticles();
    },
    onError: (error) => {
      setToDelete(null);
      showToast(
        getArticleErrorMessage(error, 'Failed to delete article.'),
        'error',
      );
      invalidateArticles();
    },
  });

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const data = articlesQuery.data;
  const articles = data?.articles ?? [];
  const categories = categoriesQuery.data ?? [];
  const noCategories = categoriesQuery.isSuccess && categories.length === 0;

  const forbidden =
    isArticleApiError(articlesQuery.error) &&
    articlesQuery.error.status === 403;

  return (
    <div className="space-y-6">
      <Toast
        show={toast.show}
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
      <Alert
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        title="Delete Article?"
        description="This article will be deleted permanently and cannot be restored."
        type="danger"
        confirmText={
          deleteMutation.isPending ? 'Deleting...' : 'Delete Article'
        }
      />

      {noCategories && (
        <div className="rounded-2xl border border-[#d1b698] bg-[#ede4d8] p-4 text-sm font-medium text-[#193c1f]">
          There are no categories yet. Create one first, because every article
          needs a category.{' '}
          <Link href={ARTICLE_CATEGORIES_HREF} className="font-bold underline">
            Manage categories
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          className="flex w-fit gap-1 rounded-2xl border border-[#d0d5cb] bg-white p-1"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_TABS.map((tab) => {
            const active = (status ?? null) === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => updateParams({ status: tab.value, page: null })}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition-all ${
                  active
                    ? 'bg-[#193c1f] text-[#f7f3ed]'
                    : 'text-[#8ea087] hover:text-[#193c1f]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
          <div className="w-full sm:w-64">
            <Input
              type="select"
              aria-label="Filter by category"
              value={categoryId ? String(categoryId) : ''}
              onChange={(e) =>
                updateParams({ category: e.target.value || null, page: null })
              }
              className="py-3"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Input>
          </div>
          <Link href="/dashboard/admin/articles/new" className="shrink-0">
            <Button className="h-11 w-full whitespace-nowrap rounded-xl px-4 py-0 text-xs font-black uppercase tracking-[0.08em] sm:w-auto">
              <Plus size={16} className="shrink-0" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {search && (
        <p className="text-sm text-[#8ea087]">
          Showing results for{' '}
          <span className="font-bold text-[#193c1f]" data-no-translate>
            &quot;{search}&quot;
          </span>
        </p>
      )}

      {articlesQuery.isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="mb-3 inline-block h-7 w-7 animate-spin text-[#193c1f]" />
          <p className="text-sm font-bold text-[#8ea087]">
            Loading articles...
          </p>
        </div>
      ) : articlesQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="mb-4 text-sm font-bold text-red-600">
            {forbidden
              ? 'Access denied. Admin role required.'
              : getArticleErrorMessage(
                  articlesQuery.error,
                  'Failed to load articles.',
                )}
          </p>
          {!forbidden && (
            <Button
              variant="outline"
              className="mx-auto"
              onClick={() => articlesQuery.refetch()}
            >
              Try Again
            </Button>
          )}
        </div>
      ) : (
        <Table
          data={articles}
          keyExtractor={(article) => article.id}
          minWidth="min-w-[900px]"
          emptyMessage={
            search || status || categoryId
              ? 'No articles match the current filters.'
              : 'No articles yet. Click "New Article" to write the first one.'
          }
          currentPage={Math.min(page, Math.max(data?.totalPages ?? 1, 1))}
          totalPages={data?.totalPages ?? 0}
          onPageChange={(next) =>
            updateParams({ page: next > 1 ? String(next) : null })
          }
          paginationInfo={
            data ? `${data.totalCount} article(s) in total` : undefined
          }
          columns={[
            {
              header: 'Article',
              cell: (article) => (
                <div className="min-w-[280px] max-w-[420px]" data-no-translate>
                  <Link
                    href={`/dashboard/admin/articles/${article.id}/edit`}
                    className="font-bold text-[#193c1f] no-underline hover:text-[#8ea087]"
                  >
                    {article.title}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {article.summary}
                  </p>
                </div>
              ),
            },
            {
              header: 'Category',
              className: 'whitespace-nowrap',
              cell: (article) => (
                <span data-no-translate>{article.category.name}</span>
              ),
            },
            {
              header: 'Status',
              className: 'whitespace-nowrap',
              cell: (article) => (
                <Badge
                  status={
                    article.status === 'PUBLISHED' ? 'SUCCESS' : 'DEFAULT'
                  }
                >
                  {article.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                </Badge>
              ),
            },
            {
              header: 'Date',
              className: 'whitespace-nowrap text-xs text-gray-500 md:text-sm',
              cell: (article) =>
                article.status === 'PUBLISHED'
                  ? formatArticleDate(article.publishedAt)
                  : `Created ${formatArticleDate(article.createdAt)}`,
            },
            {
              header: 'Actions',
              headerClassName: 'text-right',
              className: 'text-right whitespace-nowrap',
              cell: (article) => {
                const isPublished = article.status === 'PUBLISHED';
                const busy =
                  statusMutation.isPending &&
                  statusMutation.variables?.id === article.id;
                return (
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/admin/articles/${article.id}/edit?view=preview`}
                      title="Preview"
                      aria-label="Preview"
                      className="rounded-xl p-2 text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f]"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/dashboard/admin/articles/${article.id}/edit`}
                      title="Edit"
                      aria-label="Edit"
                      className="rounded-xl p-2 text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f]"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      title={isPublished ? 'Move to draft' : 'Publish'}
                      aria-label={isPublished ? 'Move to draft' : 'Publish'}
                      disabled={busy}
                      onClick={() =>
                        statusMutation.mutate({
                          id: article.id,
                          next: isPublished ? 'DRAFT' : 'PUBLISHED',
                        })
                      }
                      className="rounded-xl p-2 text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f] disabled:opacity-40"
                    >
                      {busy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isPublished ? (
                        <EyeOff size={16} />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      aria-label="Delete"
                      onClick={() => setToDelete(article)}
                      className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}
