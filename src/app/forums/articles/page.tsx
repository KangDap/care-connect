'use client';

import { ArticleCard } from '@/components/article/article-card';
import { ArticleCover } from '@/components/article/article-cover';
import { ForumTabs } from '@/components/article/forum-tabs';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Pagination } from '@/components/pagination';
import { PublicHeader } from '@/components/public-header';
import {
  articleKeys,
  getArticleCategories,
  getArticleErrorMessage,
  getPublishedArticles,
  parseArticleId,
} from '@/lib/api/articles';
import { formatArticleDate } from '@/lib/article-content';
import { authClient } from '@/lib/auth/auth-client';
import type { PublicArticleQuery } from '@/types/article';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Loader2,
  MessageSquare,
  PenLine,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { startTransition, useEffect, useState } from 'react';

const PAGE_SIZE = 10;

const ArticlesContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const searchParamValue = searchParams.get('search') || '';
  const categoryId = parseArticleId(searchParams.get('category') ?? undefined);
  const page = parseArticleId(searchParams.get('page') ?? undefined) ?? 1;

  const [searchQuery, setSearchQuery] = useState(searchParamValue);

  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN';

  const query: PublicArticleQuery = {
    categoryId: categoryId ?? undefined,
    search: searchParamValue || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const categoriesQuery = useQuery({
    queryKey: articleKeys.categories,
    queryFn: getArticleCategories,
  });

  const articlesQuery = useQuery({
    queryKey: articleKeys.publicList(query),
    queryFn: () => getPublishedArticles(query),
    placeholderData: keepPreviousData,
  });

  const updateParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsString);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Keep the input in sync when the URL changes (back/forward navigation).
  useEffect(() => {
    startTransition(() => setSearchQuery(searchParamValue));
  }, [searchParamValue]);

  // Debounce typing into the URL; a new search always starts at page 1.
  useEffect(() => {
    const handler = setTimeout(() => {
      const normalized = searchQuery.trim();
      if (normalized === searchParamValue) return;
      const params = new URLSearchParams(searchParamsString);
      if (normalized) params.set('search', normalized);
      else params.delete('search');
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
    return () => clearTimeout(handler);
  }, [pathname, router, searchParamValue, searchParamsString, searchQuery]);

  const data = articlesQuery.data;
  const articles = data?.articles ?? [];
  const isFiltered = Boolean(categoryId || searchParamValue);
  const showFeatured = page === 1 && !isFiltered && articles.length > 0;
  const featured = showFeatured ? articles[0] : null;
  const gridArticles = showFeatured ? articles.slice(1) : articles;
  const categories = categoriesQuery.data ?? [];

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition-all ${
      active
        ? 'border-[#193c1f] bg-[#193c1f] text-[#f7f3ed]'
        : 'border-[#d0d5cb] bg-white text-[#8ea087] hover:border-[#193c1f] hover:text-[#193c1f]'
    }`;

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl p-6 text-left md:p-12">
        <ForumTabs />

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mb-3 text-4xl font-black uppercase leading-none tracking-tight text-[#193c1f] md:text-5xl">
              Educational Articles
            </h1>
            <p className="max-w-2xl text-lg font-medium text-[#8ea087]">
              Short reads on mental health, with links to related courses on
              Unpad Luhung.
            </p>
          </div>
          {isAdmin && (
            <Link href="/dashboard/admin/articles/new" className="no-underline">
              <Button className="h-11 w-full whitespace-nowrap rounded-xl px-5 py-0 text-xs font-black uppercase tracking-[0.08em] md:w-auto">
                <PenLine size={16} />
                Write Article
              </Button>
            </Link>
          )}
        </div>

        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="w-full lg:max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              aria-label="Search articles"
              icon={<Search size={18} />}
              maxLength={255}
              className="h-[52px] bg-[#EBE6DE]"
            />
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by category"
          >
            <button
              type="button"
              className={chipClass(!categoryId)}
              onClick={() => updateParams({ category: null, page: null })}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                data-no-translate
                className={chipClass(categoryId === category.id)}
                onClick={() =>
                  updateParams({ category: String(category.id), page: null })
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
          <section aria-live="polite">
            {articlesQuery.isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="mb-4 inline-block h-8 w-8 animate-spin text-[#193c1f]" />
                <p className="font-bold text-[#8ea087]">Fetching articles...</p>
              </div>
            ) : articlesQuery.isError ? (
              <Card className="p-10 text-center">
                <p className="mb-6 font-bold text-[#193c1f]">
                  {getArticleErrorMessage(
                    articlesQuery.error,
                    'Failed to load articles.',
                  )}
                </p>
                <Button
                  variant="outline"
                  className="mx-auto"
                  onClick={() => articlesQuery.refetch()}
                >
                  Try Again
                </Button>
              </Card>
            ) : articles.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen
                  size={40}
                  className="mx-auto mb-4 text-[#8ea087] opacity-60"
                />
                <p className="mb-2 font-black text-[#193c1f]">
                  {isFiltered
                    ? 'No articles match your search.'
                    : 'No articles have been published yet.'}
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      router.replace(pathname, { scroll: false });
                    }}
                    className="text-sm font-bold text-[#8ea087] underline hover:text-[#193c1f]"
                  >
                    Reset filters
                  </button>
                )}
              </Card>
            ) : (
              <div
                className={`space-y-8 transition-opacity ${articlesQuery.isPlaceholderData ? 'opacity-60' : ''}`}
              >
                {featured && (
                  <Link
                    href={`/forums/articles/${featured.id}`}
                    className="group block no-underline"
                  >
                    <Card className="grid rounded-[32px] transition-all duration-500 group-hover:shadow-2xl md:grid-cols-2">
                      <ArticleCover
                        imageUrl={featured.imageUrl}
                        alt={featured.title}
                        className="h-56 md:h-full md:min-h-[300px]"
                        iconSize={56}
                        priority
                      />
                      <div
                        className="flex flex-col justify-center p-8"
                        data-no-translate
                      >
                        <span className="mb-4 w-fit rounded-full bg-[#193c1f] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#f7f3ed]">
                          Latest · {featured.category.name}
                        </span>
                        <h2 className="mb-3 text-2xl font-black leading-tight tracking-tight text-[#193c1f] transition-colors group-hover:text-[#8ea087] md:text-3xl">
                          {featured.title}
                        </h2>
                        <p className="mb-6 line-clamp-3 text-sm font-medium leading-relaxed text-[#193c1f]/60 md:text-base">
                          {featured.summary}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#8ea087]">
                          <span>{formatArticleDate(featured.publishedAt)}</span>
                          <span className="inline-flex items-center gap-1 uppercase tracking-[0.12em] text-[#193c1f]">
                            Read article{' '}
                            <ArrowRight size={14} strokeWidth={3} />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {gridArticles.length > 0 && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {gridArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                )}

                {data && data.totalPages > 1 && (
                  <Pagination
                    currentPage={Math.min(page, data.totalPages)}
                    totalPages={data.totalPages}
                    onPageChange={(next) => {
                      updateParams({ page: next > 1 ? String(next) : null });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <Card className="rounded-[28px] p-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.12em] text-[#193c1f]">
                Categories
              </h2>
              {categoriesQuery.isLoading ? (
                <p className="text-sm text-[#8ea087]">Loading...</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-[#8ea087]">No categories yet.</p>
              ) : (
                <ul className="space-y-3" data-no-translate>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() =>
                          updateParams({
                            category: String(category.id),
                            page: null,
                          })
                        }
                        className="text-left"
                      >
                        <span className="block text-sm font-bold text-[#193c1f] hover:text-[#8ea087]">
                          {category.name}
                        </span>
                        {category.description && (
                          <span className="line-clamp-2 text-xs text-[#193c1f]/50">
                            {category.description}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="rounded-[28px] bg-[#193c1f] p-6 shadow-sm">
              <MessageSquare size={28} className="mb-3 text-[#d1b698]" />
              <h2 className="mb-2 text-lg font-black text-[#f7f3ed]">
                Want to talk about it?
              </h2>
              <p className="mb-5 text-sm text-[#f7f3ed]/70">
                Join a discussion room and share your experience. You can stay
                anonymous.
              </p>
              <Link
                href="/forums"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#d1b698] no-underline hover:gap-3"
              >
                Go to Discussion <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default function ArticlesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f3ed]">
          <PublicHeader />
          <main className="mx-auto max-w-7xl p-6 text-center md:p-12">
            <Loader2 className="mb-4 inline-block h-8 w-8 animate-spin text-[#193c1f]" />
            <p className="font-bold text-[#8ea087]">Fetching articles...</p>
          </main>
        </div>
      }
    >
      <ArticlesContent />
    </React.Suspense>
  );
}
