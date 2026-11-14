'use client';

import { BookOpen, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const TABS = [
  { href: '/forums', label: 'Discussion', icon: MessageSquare },
  { href: '/forums/articles', label: 'Articles', icon: BookOpen },
];

/** Switches between the forum discussion rooms and the article section. */
export function ForumTabs() {
  const pathname = usePathname();
  const isArticles = pathname.startsWith('/forums/articles');

  return (
    <nav
      aria-label="Forum sections"
      className="mx-auto mb-10 flex w-fit gap-1 rounded-2xl border border-[#d0d5cb] bg-white p-1.5 shadow-sm"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/forums/articles' ? isArticles : !isArticles;
        return (
          <Link
            key={href}
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
  );
}
