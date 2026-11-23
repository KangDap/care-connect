import type { ArticleBlock } from '@/lib/article-content';
import React from 'react';

/**
 * Renders parsed article blocks as React elements (never as raw HTML), so
 * admin-written content cannot inject markup or scripts.
 */
export function ArticleContent({
  blocks,
}: Readonly<{ blocks: ArticleBlock[] }>) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm italic text-[#8ea087]">
        This article has no content yet.
      </p>
    );
  }

  const blockKeyCounts = new Map<string, number>();

  return (
    <div className="space-y-5 text-[15px] leading-8 text-[#193c1f]/85 md:text-base">
      {blocks.map((block) => {
        let blockContentKey: string;
        if (block.type === 'heading') {
          blockContentKey = `heading:${block.id}`;
        } else if (block.type === 'list') {
          blockContentKey = `list:${block.items.join('\u001f')}`;
        } else {
          blockContentKey = `paragraph:${block.text}`;
        }
        const occurrence = blockKeyCounts.get(blockContentKey) ?? 0;
        blockKeyCounts.set(blockContentKey, occurrence + 1);
        const blockKey = `${blockContentKey}:${occurrence}`;

        if (block.type === 'heading') {
          return block.level === 2 ? (
            <h2
              key={blockKey}
              id={block.id}
              className="scroll-mt-28 pt-4 text-xl font-black tracking-tight text-[#193c1f] md:text-2xl"
            >
              {block.text}
            </h2>
          ) : (
            <h3
              key={blockKey}
              id={block.id}
              className="scroll-mt-28 pt-2 text-lg font-bold text-[#193c1f]"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === 'list') {
          const itemKeyCounts = new Map<string, number>();
          return (
            <ul
              key={blockKey}
              className="list-disc space-y-2 pl-6 marker:text-[#8ea087]"
            >
              {block.items.map((item) => {
                const occurrence = itemKeyCounts.get(item) ?? 0;
                itemKeyCounts.set(item, occurrence + 1);
                return <li key={`${item}:${occurrence}`}>{item}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={blockKey} className="whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
