import type { ArticleBlock } from '@/lib/article-content';
import React from 'react';

/**
 * Renders parsed article blocks as React elements (never as raw HTML), so
 * admin-written content cannot inject markup or scripts.
 */
export function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  if (blocks.length === 0) {
    return (
      <p className="text-sm italic text-[#8ea087]">
        This article has no content yet.
      </p>
    );
  }

  return (
    <div className="space-y-5 text-[15px] leading-8 text-[#193c1f]/85 md:text-base">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return block.level === 2 ? (
            <h2
              key={`${block.id}-${index}`}
              id={block.id}
              className="scroll-mt-28 pt-4 text-xl font-black tracking-tight text-[#193c1f] md:text-2xl"
            >
              {block.text}
            </h2>
          ) : (
            <h3
              key={`${block.id}-${index}`}
              id={block.id}
              className="scroll-mt-28 pt-2 text-lg font-bold text-[#193c1f]"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={`list-${index}`}
              className="list-disc space-y-2 pl-6 marker:text-[#8ea087]"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${index}`} className="whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
