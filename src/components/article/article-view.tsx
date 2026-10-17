'use client';

import { Card } from '@/components/card';
import {
  formatArticleDate,
  getReadingTime,
  getTableOfContents,
  isSafeExternalUrl,
  parseArticleContent,
} from '@/lib/article-content';
import { Check, Clock, ExternalLink, GraduationCap, Link2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { ArticleContent } from './article-content';
import { ArticleCover } from './article-cover';

/** The fields needed to render an article; shared by the detail page and admin preview. */
export interface ArticleViewData {
  title: string;
  summary: string;
  content: string;
  categoryName: string;
  imageUrl: string | null;
  ctaText: string;
  courseUrl: string;
  publishedAt: string | null;
}

function CourseCta({
  ctaText,
  courseUrl,
  compact = false,
}: {
  ctaText: string;
  courseUrl: string;
  compact?: boolean;
}) {
  const valid = isSafeExternalUrl(courseUrl);

  return (
    <div
      className={`rounded-[28px] border border-[#d1b698]/60 bg-[#ede4d8] ${compact ? 'p-5' : 'p-6 md:p-8'}`}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#193c1f]/60">
        <GraduationCap size={16} />
        Continue learning
      </div>
      {!compact && (
        <p className="mb-5 text-sm font-medium leading-relaxed text-[#193c1f]/70">
          Learn more about this topic through a related course on Unpad Luhung.
        </p>
      )}
      {valid ? (
        <a
          href={courseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#193c1f] px-5 py-3.5 text-center text-sm font-bold text-[#f7f3ed] no-underline transition-all hover:bg-[#2d5a35] active:scale-95 sm:w-auto"
          data-no-translate
        >
          {ctaText || 'Open course'}
          <ExternalLink size={16} className="shrink-0" />
        </a>
      ) : (
        <p className="text-sm font-bold text-[#193c1f]/50">
          The course link is not available yet.
        </p>
      )}
    </div>
  );
}

export function ArticleView({
  article,
  preview = false,
  breadcrumb,
  footer,
}: {
  article: ArticleViewData;
  preview?: boolean;
  breadcrumb?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const blocks = useMemo(
    () => parseArticleContent(article.content),
    [article.content],
  );
  const toc = useMemo(() => getTableOfContents(blocks), [blocks]);
  const readingTime = getReadingTime(article.summary, article.content);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="text-left">
      {breadcrumb}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <header className="mb-8" data-no-translate>
            <span className="mb-4 inline-block rounded-full bg-[#EBE6DE] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8ea087]">
              {article.categoryName || 'Uncategorized'}
            </span>
            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-[#193c1f] md:text-5xl">
              {article.title || 'Untitled article'}
            </h1>
            {article.summary && (
              <p className="mb-5 text-lg font-medium leading-relaxed text-[#193c1f]/60">
                {article.summary}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[#8ea087]">
              <span>
                {article.publishedAt
                  ? formatArticleDate(article.publishedAt)
                  : 'Not published yet'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {readingTime} min read
              </span>
            </div>
          </header>

          <ArticleCover
            imageUrl={article.imageUrl}
            alt={article.title}
            className="mb-10 aspect-[16/9] rounded-[32px]"
            iconSize={64}
            priority
          />

          <div data-no-translate>
            <ArticleContent blocks={blocks} />
          </div>

          <div className="mt-12">
            <CourseCta
              ctaText={article.ctaText}
              courseUrl={article.courseUrl}
            />
          </div>

          {footer}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {toc.length > 0 && (
            <Card className="rounded-[28px] p-6">
              <h2 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-[#193c1f]">
                Table of Contents
              </h2>
              <ol className="space-y-2" data-no-translate>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm font-medium text-[#193c1f]/70 no-underline hover:text-[#8ea087]"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          <CourseCta
            ctaText={article.ctaText}
            courseUrl={article.courseUrl}
            compact
          />

          {!preview && (
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#d0d5cb] bg-white px-5 py-3 text-sm font-bold text-[#193c1f] transition-all hover:bg-[#f7f3ed]"
            >
              {copied ? <Check size={16} /> : <Link2 size={16} />}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          )}
        </aside>
      </div>
    </article>
  );
}
