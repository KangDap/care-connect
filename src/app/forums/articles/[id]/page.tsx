'use client';

import { ArticleCard } from '@/components/article/article-card';
import { ArticleView } from '@/components/article/article-view';
import { ForumTabs } from '@/components/article/forum-tabs';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { PublicHeader } from '@/components/public-header';
import {
  articleKeys,
  getArticleErrorMessage,
  getPublishedArticle,
  getPublishedArticles,
  isArticleApiError,
  parseArticleId,
} from '@/lib/api/articles';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

export default function ArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = parseArticleId(params?.id);

  const articleQuery = useQuery({
    queryKey: articleKeys.publicDetail(articleId ?? 0),
    queryFn: () => getPublishedArticle(articleId as number),
    enabled: articleId !== null,
    retry: (count, error) =>
      !(isArticleApiError(error) && error.status < 500) && count < 2,
  });

  const article = articleQuery.data;
  const relatedQuery = useQuery({
    queryKey: articleKeys.publicList({
      categoryId: article?.categoryId,
      limit: 4,
    }),
    queryFn: () =>
      getPublishedArticles({ categoryId: article?.categoryId, limit: 4 }),
    enabled: Boolean(article?.categoryId),
  });
  const related = (relatedQuery.data?.articles ?? [])
    .filter((item) => item.id !== article?.id)
    .slice(0, 3);

  const notFound =
    articleId === null ||
    (isArticleApiError(articleQuery.error) &&
      (articleQuery.error.status === 404 || articleQuery.error.status === 400));

  return (
    <div className="min-h-screen bg-[#f7f3ed]">
      <PublicHeader />

      <main className="mx-auto max-w-7xl p-6 md:p-12">
        <ForumTabs />

        {notFound ? (
          <Card className="mx-auto max-w-xl p-12 text-center">
            <h1 className="mb-3 text-2xl font-black text-[#193c1f]">
              Article not found
            </h1>
            <p className="mb-8 text-sm text-[#8ea087]">
              This article may have been removed or is no longer published.
            </p>
            <Link href="/forums/articles" className="no-underline">
              <Button className="mx-auto">Back to Articles</Button>
            </Link>
          </Card>
        ) : articleQuery.isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="mb-4 inline-block h-8 w-8 animate-spin text-[#193c1f]" />
            <p className="font-bold text-[#8ea087]">Loading article...</p>
          </div>
        ) : articleQuery.isError || !article ? (
          <Card className="mx-auto max-w-xl p-12 text-center">
            <p className="mb-6 font-bold text-[#193c1f]">
              {getArticleErrorMessage(
                articleQuery.error,
                'Failed to load the article.',
              )}
            </p>
            <Button
              variant="outline"
              className="mx-auto"
              onClick={() => articleQuery.refetch()}
            >
              Try Again
            </Button>
          </Card>
        ) : (
          <>
            <ArticleView
              article={{
                title: article.title,
                summary: article.summary,
                content: article.content,
                categoryName: article.category.name,
                imageUrl: article.imageUrl,
                ctaText: article.ctaText,
                courseUrl: article.courseUrl,
                publishedAt: article.publishedAt,
              }}
              breadcrumb={
                <nav
                  aria-label="Breadcrumb"
                  className="mb-8 flex flex-wrap items-center gap-2 text-xs font-bold text-[#8ea087]"
                >
                  <Link
                    href="/forums/articles"
                    className="inline-flex items-center gap-1 text-[#8ea087] no-underline hover:text-[#193c1f]"
                  >
                    <ArrowLeft size={14} /> Articles
                  </Link>
                  <span aria-hidden>/</span>
                  <Link
                    href={`/forums/articles?category=${article.categoryId}`}
                    className="text-[#8ea087] no-underline hover:text-[#193c1f]"
                    data-no-translate
                  >
                    {article.category.name}
                  </Link>
                </nav>
              }
              footer={
                <Card className="mt-8 flex flex-col gap-4 rounded-[28px] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={22} className="text-[#8ea087]" />
                    <p className="text-sm font-bold text-[#193c1f]">
                      Want to discuss this topic with others?
                    </p>
                  </div>
                  <Link
                    href="/forums"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#193c1f] no-underline hover:gap-3"
                  >
                    Open Discussion <ArrowRight size={14} strokeWidth={3} />
                  </Link>
                </Card>
              }
            />

            {related.length > 0 && (
              <section className="mt-16">
                <h2 className="mb-6 text-2xl font-black tracking-tight text-[#193c1f]">
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((item) => (
                    <ArticleCard key={item.id} article={item} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
