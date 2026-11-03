'use client';

import { FileText, Tags } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React from 'react';

import { ArticleCategoriesPanel } from './ArticleCategoriesPanel';
import { ArticlesAdminClient } from './ArticlesAdminClient';
import {
  ARTICLE_CATEGORIES_HREF,
  ARTICLE_MANAGEMENT_HREF,
  type ArticleManagementTab,
  parseArticleManagementTab,
} from './article-management-tabs';

const TABS: {
  key: ArticleManagementTab;
  label: string;
  href: string;
  icon: React.ElementType;
}[] = [
  {
    key: 'articles',
    label: 'Articles',
    href: ARTICLE_MANAGEMENT_HREF,
    icon: FileText,
  },
  {
    key: 'categories',
    label: 'Categories',
    href: ARTICLE_CATEGORIES_HREF,
    icon: Tags,
  },
];

/**
 * Admin Article Management: articles and their categories on one page,
 * switched with the `?tab=` query parameter.
 */
export function ArticleManagement() {
  const searchParams = useSearchParams();
  const activeTab = parseArticleManagementTab(searchParams.get('tab'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#193c1f] sm:text-[32px]">
          Article Management
        </h1>
        <p className="font-medium text-[#8ea087]">
          Write, publish, and manage educational articles and their categories.
        </p>
      </div>

      <nav
        aria-label="Article management sections"
        className="flex w-fit gap-1 rounded-2xl border border-[#d0d5cb] bg-white p-1.5 shadow-sm"
      >
        {TABS.map(({ key, label, href, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <Link
              key={key}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] no-underline transition-all ${
                active
                  ? 'bg-[#193c1f] text-[#f7f3ed] shadow-sm'
                  : 'text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f]'
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {activeTab === 'categories' ? (
        <ArticleCategoriesPanel />
      ) : (
        <ArticlesAdminClient />
      )}
    </div>
  );
}
