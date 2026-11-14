import { parseArticleId } from '@/lib/api/articles';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ArticleEditor } from '../../ArticleEditor';

export const metadata = {
  title: 'Edit Article | CareConnect Admin',
  description: 'Edit, preview, and publish an article.',
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;
  const articleId = parseArticleId(id);
  if (articleId === null) notFound();

  return (
    <Suspense
      fallback={
        <div className="py-10 text-center text-sm font-bold text-[#8ea087]">
          Loading editor...
        </div>
      }
    >
      <ArticleEditor key={articleId} articleId={articleId} />
    </Suspense>
  );
}
