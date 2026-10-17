import { Card } from '@/components/card';
import { formatArticleDate } from '@/lib/article-content';
import type { ArticleListItem } from '@/types/article';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { ArticleCover } from './article-cover';

export function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link
      href={`/forums/articles/${article.id}`}
      className="group block h-full no-underline"
    >
      <Card className="flex h-full flex-col rounded-[32px] transition-all duration-500 group-hover:shadow-2xl">
        <ArticleCover
          imageUrl={article.imageUrl}
          alt={article.title}
          className="h-44"
        />
        <div className="flex flex-1 flex-col p-6" data-no-translate>
          <span className="mb-3 w-fit rounded-full bg-[#EBE6DE] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8ea087]">
            {article.category.name}
          </span>
          <h3 className="mb-2 line-clamp-2 text-lg font-black leading-snug tracking-tight text-[#193c1f] transition-colors group-hover:text-[#8ea087]">
            {article.title}
          </h3>
          <p className="mb-6 line-clamp-3 flex-1 text-sm font-medium leading-relaxed text-[#193c1f]/60">
            {article.summary}
          </p>
          <div className="flex items-center justify-between border-t border-[#f7f3ed] pt-4 text-[11px] font-bold text-[#8ea087]">
            <span>{formatArticleDate(article.publishedAt)}</span>
            <ArrowRight
              size={16}
              strokeWidth={3}
              className="text-[#193c1f] transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
