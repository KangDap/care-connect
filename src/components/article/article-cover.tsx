'use client';

import { isSafeExternalUrl } from '@/lib/article-content';
import { BookOpen } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';

/**
 * Article image with a neutral placeholder when `imageUrl` is null, invalid,
 * or fails to load. The parent decides the size; this fills it.
 */
export function ArticleCover({
  imageUrl,
  alt,
  className = '',
  iconSize = 40,
  priority = false,
}: {
  imageUrl: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = isSafeExternalUrl(imageUrl) && !failed;

  return (
    <div
      className={`relative overflow-hidden bg-[#f7f3ed] ${className}`}
      aria-hidden={showImage ? undefined : true}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#f7f3ed] via-[#E6DED3] to-[#d0d5cb]" />
      {showImage ? (
        <Image
          src={imageUrl as string}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="relative z-10 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setFailed(true)}
          priority={priority}
          unoptimized
        />
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <BookOpen size={iconSize} className="text-[#8ea087] opacity-50" />
        </div>
      )}
    </div>
  );
}
